const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useCallback, useEffect } from "react";

import { Camera, RotateCcw, Check, Upload, Loader2, ScanLine, X, ExternalLink, CameraOff, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileSelect } from "@/components/mobile/ActionSheet";
import PageContainer from "@/components/layout/PageContainer";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  isSecureContext,
  openStandalone,
  describeCameraError
} from "@/lib/cameraPermission";

const makePage = (dataUrl, mime, name) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  dataUrl,
  mime,
  name
});

export default function ScanDocument() {
  const [mode, setMode] = useState("idle"); // idle, camera, preview
  const [pages, setPages] = useState([]);
  const [docName, setDocName] = useState("");
  const [folderId, setFolderId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [tags, setTags] = useState("");
  const [folders, setFolders] = useState([]);
  const [students, setStudents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const deviceInputRef = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    db.entities.Folder.list().then(setFolders);
    db.entities.Student.list().then(setStudents).catch(() => {});
  }, []);

  const defaultDocName = () => `Scan ${new Date().toISOString().slice(0, 10)}`;

  const startCamera = async () => {
    setCameraError(null);

    // Camera requires a secure (HTTPS) context.
    if (!isSecureContext()) {
      setCameraError({
        title: "Camera needs a secure connection",
        description: "Camera access only works over HTTPS. Please open the app via its https:// link."
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setMode("camera");
    } catch (err) {
      const info = describeCameraError(err);
      setCameraError(info);
      toast({ title: info.title, description: info.description, variant: "destructive" });
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Attach the stream to the <video> once it mounts in camera mode.
  useEffect(() => {
    if (mode !== "camera") return;
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [mode]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const name = `scan_${new Date().toISOString().slice(0, 10)}_${Date.now().toString(36)}.jpg`;
    setDocName((prev) => prev || defaultDocName());
    setPages((prev) => [...prev, makePage(dataUrl, "image/jpeg", name)]);
    stopCamera();
    setMode("preview");
  };

  const closeCamera = () => {
    stopCamera();
    setMode(pages.length > 0 ? "preview" : "idle");
  };

  const handleFileInput = async (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    if (!selected.length) return;
    setDocName((prev) => prev || defaultDocName());
    const loaded = await Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) =>
              resolve(
                makePage(
                  ev.target.result,
                  file.type || "application/octet-stream",
                  file.name || `scan_${Date.now()}.jpg`
                )
              );
            reader.readAsDataURL(file);
          })
      )
    );
    setPages((prev) => [...prev, ...loaded]);
    setMode("preview");
  };

  const removePage = (id) => {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) setMode("idle");
      return next;
    });
  };

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const handleUpload = async () => {
    if (pages.length === 0) return;
    setUploading(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const pageUrls = [];
      let totalSize = 0;
      let firstType = "image/jpeg";
      for (const page of pages) {
        const blob = dataURLtoBlob(page.dataUrl);
        const file = new File([blob], page.name, { type: blob.type || "image/jpeg" });
        const { file_url } = await db.integrations.Core.UploadFile({ file });
        if (pageUrls.length === 0) firstType = blob.type || "image/jpeg";
        pageUrls.push(file_url);
        totalSize += blob.size;
      }
      await db.entities.SchoolFile.create({
        name: docName.trim() || pages[0].name,
        file_url: pageUrls[0],
        page_urls: pageUrls,
        page_count: pageUrls.length,
        file_type: firstType,
        file_size: totalSize,
        folder_id: folderId || null,
        student_id: studentId || null,
        tags: tagList,
        source: "scan"
      });
      toast({
        title: "Document saved",
        description:
          pageUrls.length > 1
            ? `${pageUrls.length} pages saved as one document.`
            : "Your scanned document has been uploaded."
      });
      navigate("/files");
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const startNewDocument = () => {
    setPages([]);
    setDocName("");
    startCamera();
  };

  const cancelAll = () => {
    stopCamera();
    setPages([]);
    setDocName("");
    setMode("idle");
    setTags("");
    setFolderId("");
    setStudentId("");
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <PageContainer>
      <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-slate-100">Scan Document</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scan a document, add as many pages as you need, then save it as one file</p>
      </div>

      {mode === "idle" &&
        <div className="space-y-4">
          <button
            onClick={startCamera}
            className="w-full from-violet-600 to-purple-600 text-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow bg-[#788fb0]">

            <Camera className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <p className="text-xl font-semibold">Open Camera</p>
            <p className="text-sm opacity-70 mt-2">Take a photo of the first page — you can add more pages after each shot</p>
          </button>

          {cameraError && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 p-5 flex gap-3">
              <CameraOff className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{cameraError.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cameraError.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={startCamera}>Try again</Button>
                  {cameraError.showOpenButton && (
                    <Button size="sm" variant="outline" onClick={() => openStandalone("/scan")}>
                      <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-50 px-4 text-sm text-slate-400">or</span></div>
          </div>

          <label className="block bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
            <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">Upload from device</p>
            <p className="text-xs text-slate-400 mt-1">Select one or more pages — they are saved together as one document</p>
            <input type="file" multiple accept="image/*,application/pdf,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
        }

      {mode === "camera" &&
        <div className="space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
            {/* Scan overlay guides */}
            <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none">
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
            </div>
            <div className="absolute top-3 right-3">
              <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded-full">
                {pages.length} page{pages.length === 1 ? "" : "s"} captured
              </span>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <Button variant="secondary" size="icon" className="rounded-full w-12 h-12" onClick={closeCamera}>
                <X className="w-5 h-5" />
              </Button>
              <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-white/50 hover:scale-105 transition-transform flex items-center justify-center">
                <ScanLine className="w-6 h-6 text-slate-700" />
              </button>
              <div className="w-12 h-12" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        }

      {mode === "preview" && pages.length > 0 &&
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {pages.length} page{pages.length === 1 ? "" : "s"} in this document
            </p>
            <button onClick={cancelAll} className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pages.map((page, index) => (
              <div key={page.id} className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                {page.mime.startsWith("image/") ? (
                  <img src={page.dataUrl} alt={`Page ${index + 1}`} className="w-full h-36 object-cover bg-slate-50" />
                ) : (
                  <div className="w-full h-36 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 p-2 text-center">
                    <FileText className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="text-[11px] text-slate-500 truncate w-full">{page.name}</p>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[11px] px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
                <button
                  onClick={() => removePage(page.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="text-[11px] text-slate-500 px-2 py-1.5 truncate">{page.name}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={startCamera}>
              <Camera className="w-4 h-4 mr-2" /> Add page
            </Button>
            <Button variant="outline" onClick={() => deviceInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" /> Add files
            </Button>
            <input
              ref={deviceInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
            <div>
              <Label>Document Name</Label>
              <Input
                placeholder="e.g. Form 137 — Juan Dela Cruz"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>
            <div>
              <Label>Save to Folder</Label>
              <MobileSelect
                value={folderId}
                onValueChange={setFolderId}
                placeholder="Select a folder (optional)"
                options={folders.map((f) => ({ value: f.id, label: f.name }))}
                triggerClassName="w-full" />
            </div>
            <div>
              <Label>Link to Student (optional)</Label>
              <MobileSelect
                value={studentId}
                onValueChange={setStudentId}
                placeholder="Select a student"
                options={students.map((s) => ({
                  value: s.id,
                  label: s.grade ? `${s.name} — ${s.grade}` : s.name
                }))}
                triggerClassName="w-full" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input placeholder="e.g. report-card, grade-10" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={startNewDocument} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" /> New document
            </Button>
            <Button onClick={handleUpload} disabled={uploading} className="flex-1">
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Save document · {pages.length} page{pages.length === 1 ? "" : "s"}</>
              )}
            </Button>
          </div>
        </div>
        }
      </div>
    </PageContainer>);

}