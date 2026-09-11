import React, { useEffect, useRef, useState } from "react";
import { BlobProvider } from "@react-pdf/renderer";
import { Document as PdfDocument, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./MobilePdfViewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function PdfCanvas({ url }) {
  const containerRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(720);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const updateWidth = () => setPageWidth(Math.max(240, Math.min(900, containerRef.current.clientWidth - 20)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return <div className="mobile-pdf-scroll" ref={containerRef}><PdfDocument file={url} loading={<p className="empty">Chargement du document...</p>} error={<p className="message error">Le document PDF ne peut pas être affiché sur cet appareil.</p>} onLoadSuccess={({ numPages }) => setPageCount(numPages)}>{Array.from({ length: pageCount }, (_, index) => <Page className="mobile-pdf-page" key={`page-${index + 1}`} pageNumber={index + 1} width={pageWidth} renderAnnotationLayer renderTextLayer />)}</PdfDocument></div>;
}

export default function MobilePdfViewer({ document }) {
  return <div className="mobile-pdf-viewer"><BlobProvider document={document}>{({ url, loading, error }) => {
    if (loading) return <p className="empty">Génération du document...</p>;
    if (error || !url) return <p className="message error">Le document PDF n’a pas pu être généré.</p>;
    return <PdfCanvas url={url} />;
  }}</BlobProvider></div>;
}
