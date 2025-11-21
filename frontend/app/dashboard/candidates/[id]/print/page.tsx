'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RirekishoPrintView from "@/components/RirekishoPrintView";
import { toast } from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export default function PrintCandidatePage() {
  const router = useRouter();
  const [candidateData, setCandidateData] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Obtener datos del candidato
    const fetchCandidateData = async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setError("認証トークンが見つかりません。ログインし直してください。");
          return;
        }

        // Extraer el ID del candidato de la URL
        const pathSegments = window.location.pathname.split('/');
        const candidateId = pathSegments[pathSegments.length - 2]; // El penúltimo segmento es el ID

        if (!candidateId) {
          setError("候補者IDが見つかりません。");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          const message = typeof errorPayload.detail === "string" ? errorPayload.detail : "候補者データの取得に失敗しました。";
          throw new Error(message);
        }

        const data = await response.json();
        setCandidateData(data);

        // Si hay foto, establecer la vista previa
        if (data.photo_data_url) {
          setPhotoPreview(data.photo_data_url);
        }

        // Auto-imprimir después de cargar los datos
        setTimeout(() => {
          window.print();
        }, 1000);

      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      // Redirigir de vuelta a la página de detalles del candidato después de imprimir
      router.back();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">エラー</div>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">候補者データが見つかりません</div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-page-container">
      <div className="print-toolbar">
        <button onClick={() => window.print()} className="print-btn">
          印刷する
        </button>
        <button onClick={() => router.back()} className="back-btn">
          戻る
        </button>
      </div>
      <div className="print-content">
        <RirekishoPrintView data={candidateData} photoPreview={photoPreview} />
      </div>
      <style jsx>{`
        .print-page-container {
          width: 100%;
          min-height: 100vh;
          background-color: #f5f5f5;
          display: flex;
          flex-direction: column;
        }
        
        .print-toolbar {
          position: sticky;
          top: 0;
          background-color: white;
          padding: 10px;
          display: flex;
          justify-content: center;
          gap: 15px;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .print-btn {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .back-btn {
          background-color: #6b7280;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .print-content {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 20px;
        }
        
        @media print {
          .print-page-container {
            background-color: white;
          }
          
          .print-toolbar {
            display: none !important;
          }
          
          .print-content {
            padding: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}