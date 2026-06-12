"use client";

import { useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  recordingObjectUrl,
  uploadRecording,
  type Recording,
  type SessionRow,
  type User,
} from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatCents, formatDate } from "@/lib/format";
import { Badge, Button, Card } from "@/components/ui";

export function SessionRoom({ session, user }: { session: SessionRow; user: User }) {
  const [jitsiDomain, setJitsiDomain] = useState("meet.jit.si");
  const [joined, setJoined] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const room = `OmniMarkIt-${session.id}`;

  function loadRecordings() {
    api.sessionRecordings(session.id).then(setRecordings).catch(() => {});
  }

  useEffect(() => {
    api.appConfig().then((c) => setJitsiDomain(c.jitsi_domain)).catch(() => {});
    loadRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  return (
    <Card className="bg-navy text-cream">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">Session room</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBoard((v) => !v)}>
            {showBoard ? "Hide whiteboard" : "Whiteboard"}
          </Button>
        </div>
      </div>

      {/* Live video (Jitsi — free, no account) */}
      {joined ? (
        <iframe
          title="Video call"
          src={`https://${jitsiDomain}/${room}#config.prejoinPageEnabled=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="h-[28rem] w-full rounded-lg border border-cream/20 bg-black"
        />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-cream/30">
          <span className="text-cream/60">🎥 Live video + screen share, powered by Jitsi</span>
          <Button onClick={() => setJoined(true)}>Join the call</Button>
        </div>
      )}

      {joined && <Recorder sessionId={session.id} onUploaded={loadRecordings} />}

      {showBoard && <Whiteboard sessionId={session.id} />}

      <RecordingsList
        recordings={recordings}
        user={user}
        onChange={loadRecordings}
      />
    </Card>
  );
}

// --- Screen-capture recorder → uploads a local recording ---
function Recorder({ sessionId, onUploaded }: { sessionId: string; onUploaded: () => void }) {
  const { toast } = useToast();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      toast("Screen recording isn't supported in this browser", "error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setBusy(true);
        try {
          await uploadRecording(sessionId, blob);
          toast("Recording saved ✓");
          onUploaded();
        } catch (e) {
          toast(e instanceof ApiError ? e.message : "Upload failed", "error");
        } finally {
          setBusy(false);
        }
      };
      // If the user stops sharing via the browser UI, end the recording.
      stream.getVideoTracks()[0]?.addEventListener("ended", () => stop());
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch {
      toast("Recording permission denied", "error");
    }
  }

  function stop() {
    recRef.current?.state !== "inactive" && recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      {recording ? (
        <Button variant="danger" onClick={stop}>
          ⏹ Stop &amp; save recording
        </Button>
      ) : (
        <Button variant="outline" onClick={start} disabled={busy}>
          {busy ? "Saving…" : "⏺ Record session"}
        </Button>
      )}
      <span className="text-xs text-cream/50">
        Recording captures your screen + audio and is stored on the server.
      </span>
    </div>
  );
}

// --- Shared whiteboard (synced through the backend) ---
type Stroke = { color: string; width: number; points: { x: number; y: number }[] };

function Whiteboard({ sessionId }: { sessionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const [color, setColor] = useState("#05102E");
  const lastSavedRef = useRef<string>("");

  function redraw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    for (const st of strokesRef.current) {
      ctx.strokeStyle = st.color;
      ctx.lineWidth = st.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      st.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.stroke();
    }
  }

  async function save() {
    const data = JSON.stringify(strokesRef.current);
    lastSavedRef.current = data;
    try {
      await api.putWhiteboard(sessionId, data);
    } catch {
      /* ignore */
    }
  }

  async function load() {
    try {
      const res = await api.getWhiteboard(sessionId);
      if (res.data && res.data !== lastSavedRef.current && !drawingRef.current) {
        lastSavedRef.current = res.data;
        strokesRef.current = JSON.parse(res.data);
        redraw();
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    redraw();
    load();
    const t = setInterval(load, 3000); // poll for the other party's changes
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvasRef.current!.width,
      y: ((e.clientY - r.top) / r.height) * canvasRef.current!.height,
    };
  }
  function down(e: React.PointerEvent) {
    drawingRef.current = { color, width: color === "#ffffff" ? 18 : 3, points: [pos(e)] };
  }
  function move(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    drawingRef.current.points.push(pos(e));
    redraw();
    const ctx = canvasRef.current!.getContext("2d")!;
    const st = drawingRef.current;
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.width;
    ctx.beginPath();
    st.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  function up() {
    if (drawingRef.current) {
      strokesRef.current.push(drawingRef.current);
      drawingRef.current = null;
      save();
    }
  }
  function clear() {
    strokesRef.current = [];
    redraw();
    save();
  }

  const COLORS = ["#05102E", "#C49A2A", "#dc2626", "#16a34a", "#ffffff"];
  return (
    <div className="mt-3 rounded-lg bg-white p-2">
      <div className="mb-2 flex items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            title={c === "#ffffff" ? "Eraser" : c}
            className={`h-6 w-6 rounded-full border-2 ${
              color === c ? "border-navy" : "border-navy/20"
            }`}
            style={{ background: c }}
          />
        ))}
        <button onClick={clear} className="ml-auto text-xs font-medium text-red-600">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={420}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="h-[300px] w-full touch-none rounded border border-navy/10"
      />
    </div>
  );
}

// --- Recordings list with permission + free/paid viewing ---
function RecordingsList({
  recordings,
  user,
  onChange,
}: {
  recordings: Recording[];
  user: User;
  onChange: () => void;
}) {
  const { toast } = useToast();
  const [playing, setPlaying] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  async function view(r: Recording) {
    try {
      const url = await recordingObjectUrl(r.id);
      setVideoUrl(url);
      setPlaying(r.id);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Cannot view", "error");
    }
  }

  async function pay(r: Recording) {
    try {
      await api.purchaseRecording(r.id);
      toast("Recording unlocked ✓");
      onChange();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Payment failed", "error");
    }
  }

  if (recordings.length === 0) {
    return (
      <p className="mt-4 text-sm text-cream/50">
        No recordings yet. Use “Record session” during the call.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold text-cream/80">Recordings</h3>
      {recordings.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
        >
          <div>
            <span className="text-cream">Recorded {formatDate(r.created_at)}</span>{" "}
            {r.in_free_window ? (
              <Badge className="bg-green-100 text-green-800">free until {formatDate(r.free_until)}</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800">
                {formatCents(r.price_cents)} to view
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!r.granted && user.role !== "admin" ? (
              <span className="text-xs text-cream/50">Awaiting admin permission</span>
            ) : r.requires_payment ? (
              <Button onClick={() => pay(r)}>Pay {formatCents(r.price_cents)} to view</Button>
            ) : (
              <Button variant="outline" onClick={() => view(r)}>
                ▶ View
              </Button>
            )}
          </div>
        </div>
      ))}

      {playing && videoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setPlaying(null);
            setVideoUrl(null);
          }}
        >
          <video src={videoUrl} controls autoPlay className="max-h-[80vh] w-full max-w-3xl rounded-lg" />
        </div>
      )}
    </div>
  );
}
