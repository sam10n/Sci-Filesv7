import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

export default function FilePreviewModal({ open, onClose, file }) {
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [file?.id]);

  if (!file) return null;

  const pages = file.page_urls?.length ? file.page_urls : [file.file_url];
  const current = pages[Math.min(pageIndex, pages.length - 1)];
  const t = (file.file_type || "").toLowerCase();
  const isImage = t.includes("image") || t.includes("png") || t.includes("jpg") || t.includes("jpeg") || t.includes("gif") || t.includes("webp");
  const isPdf = t.includes("pdf");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{file.name}</DialogTitle>
          {pages.length > 1 && (
            <p className="text-xs text-slate-500">Page {pageIndex + 1} of {pages.length}</p>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-auto min-h-0">
          {isImage ? (
            <img src={current} alt={file.name} className="w-full rounded-lg object-contain max-h-[60vh]" />
          ) : isPdf ? (
            <iframe src={current} className="w-full h-[60vh] rounded-lg border" title={file.name} />
          ) : (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">Preview not available for this file type.</p>
              <p className="text-xs mt-1">Download the file to view it.</p>
            </div>
          )}
          {pages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pt-3">
              {pages.map((url, index) => (
                <button
                  key={url}
                  onClick={() => setPageIndex(index)}
                  className={`shrink-0 w-14 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                    index === pageIndex ? "border-primary" : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <img src={url} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={() => window.open(current, "_blank")}>
            <ExternalLink className="w-4 h-4 mr-2" /> Open
          </Button>
          <a href={current} download={file.name}>
            <Button>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}