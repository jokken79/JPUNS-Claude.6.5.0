import React from 'react';
import Image from 'next/image';

interface RirekishoPrintViewProps {
  data: any;
  photoPreview?: string;
}

const formatDateToJapanese = (dateString: string) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return "";
  }
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return "";
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}年${paddedMonth}月${paddedDay}日`;
  } catch (e) {
    console.error("Error formatting date string:", dateString, e);
    return "";
  }
};

const formatMonthToJapanese = (monthString: string) => {
  if (!monthString || !/^\d{4}-\d{2}$/.test(monthString)) {
    return "";
  }
  try {
    const [year, month] = monthString.split('-');
    if (!year || !month) return "";
    const paddedMonth = month.padStart(2, '0');
    return `${year}年${paddedMonth}月`;
  } catch (e) {
    console.error("Error formatting month string:", monthString, e);
    return "";
  }
};

const RirekishoPrintView: React.FC<RirekishoPrintViewProps> = ({ data, photoPreview }) => {
  const levels = {
    speak: ["初級（挨拶程度）", "中級（日常会話・就職可）", "上級（通訳可）"],
    listen: ["初級（挨拶程度）", "中級（日常会話・就職可）", "上級（通訳可）"],
    simple: ["できる", "少し", "できない"],
    timeInJapan: [
      ...[...Array(11).keys()].map(i => `${i + 1}ヶ月`),
      ...[...Array(20).keys()].map(i => `${i + 1}年`),
      "20年以上",
    ],
    residenceOptions: ["同居", "別居", "国内", "国外"],
    commuteOptions: ["自家用車", "送迎", "原付電動機", "自転車", "歩き"],
    relationOptions: ["妻", "長男", "次男", "息子", "子", "長女", "次女", "娘", "母", "父", "その他"],
  };

  const applicantId = data?.applicantId ?? data?.applicant_id ?? "";

  return (
    <div className="rirekisho-print-container">
      {/* Header */}
      <div className="print-header">
        <h1>履歴書</h1>
      </div>

      {/* Basic Info - Photo and Personal Details */}
      <div className="form-section basic-info-layout">
        <div className="photo-container">
          <div className="photo-frame">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="証明写真"
                width={220}
                height={280}
                className="photo-img"
                priority
                unoptimized
              />
            ) : (
              <span className="photo-placeholder">写真</span>
            )}
          </div>
        </div>
        <div className="info-column">
          <table className="info-table personal-info-table">
            <tbody>
              <tr className="tall-row">
                <th>受付日</th>
                <td colSpan={3}>{formatDateToJapanese(data.receptionDate)}</td>
                <th>来日</th>
                <td colSpan={3}>{data.timeInJapan}</td>
              </tr>
              <tr className="tall-row">
                <th>氏名</th>
                <td colSpan={3}>{data.nameKanji}</td>
                <th>フリガナ</th>
                <td colSpan={3}>{data.nameFurigana}</td>
              </tr>
              <tr className="tall-row">
                <th>生年月日</th>
                <td>{formatDateToJapanese(data.birthday)}</td>
                <th>年齢</th>
                <td>{data.age}</td>
                <th>性別</th>
                <td>{data.gender}</td>
                <th>国籍</th>
                <td>{data.nationality}</td>
              </tr>
              <tr className="tall-row">
                <th>郵便番号</th>
                <td>{data.postalCode}</td>
                <th>携帯電話</th>
                <td>{data.mobile}</td>
                <th>電話番号</th>
                <td colSpan={3}>{data.phone}</td>
              </tr>
              <tr className="tall-row">
                <th>住所</th>
                <td colSpan={7}>{data.address}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Contact - Separate Section */}
      <div className="form-section emergency-contact-section">
        <h2>緊急連絡先</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <th>氏名</th>
              <td>{data.emergencyName}</td>
              <th>続柄</th>
              <td>{data.emergencyRelation}</td>
              <th>電話番号</th>
              <td>{data.emergencyPhone}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Documents */}
      <div className="form-section documents-section">
        <h2>書類関係</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <th>在留種類</th>
              <td>{data.visaType}</td>
              <th>在留期間</th>
              <td>{data.visaPeriod}</td>
              <th>在留カード番号</th>
              <td>{data.residenceCardNo}</td>
            </tr>
            <tr>
              <th>パスポート番号</th>
              <td>{data.passportNo}</td>
              <th>パスポート期限</th>
              <td>{formatDateToJapanese(data.passportExpiry)}</td>
              <th>運転免許番号</th>
              <td>{data.licenseNo}</td>
            </tr>
            <tr>
              <th>運転免許期限</th>
              <td>{formatDateToJapanese(data.licenseExpiry)}</td>
              <th>自動車所有</th>
              <td>{data.carOwner}</td>
              <th>任意保険加入</th>
              <td>{data.insurance}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Language & Education */}
      <div className="form-section">
        <h2>日本語能力・学歴</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <th>話す</th>
              <td>{data.speakLevel}</td>
              <th>聞く</th>
              <td>{data.listenLevel}</td>
            </tr>
            <tr>
              <th>読み書き</th>
              <td colSpan={3}>
                <div className="grid-2-cols">
                  <div>漢字(読み): {data.kanjiReadLevel}</div>
                  <div>漢字(書き): {data.kanjiWriteLevel}</div>
                  <div>ひらがな(読み): {data.hiraganaReadLevel}</div>
                  <div>ひらがな(書き): {data.hiraganaWriteLevel}</div>
                  <div>カタカナ(読み): {data.katakanaReadLevel}</div>
                  <div>カタカナ(書き): {data.katakanaWriteLevel}</div>
                </div>
              </td>
            </tr>
            <tr>
              <th>最終学歴</th>
              <td>{data.education}</td>
              <th>専攻</th>
              <td>{data.major}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Qualifications */}
      <div className="form-section">
        <h2>有資格取得</h2>
        <div className="qualifications-container">
          <div className="qualification-row">
            <span className="qualification-label">
              {data.forkliftLicense ? "✓" : "□"} フォークリフト資格
            </span>
            <span className="qualification-label">
              {data.jlpt ? "✓" : "□"} 日本語検定
            </span>
            {data.jlpt && <span className="qualification-level">({data.jlptLevel})</span>}
            {data.otherQualifications && <span className="qualification-label">その他: {data.otherQualifications}</span>}
          </div>
        </div>
      </div>

      {/* Physical Info */}
      <div className="form-section">
        <h2>身体情報・健康状態</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <th>身長(cm)</th>
              <td>{data.height}</td>
              <th>体重(kg)</th>
              <td>{data.weight}</td>
              <th>血液型</th>
              <td>{data.bloodType}</td>
              <th>ウエスト(cm)</th>
              <td>{data.waist}</td>
            </tr>
            <tr>
              <th>靴サイズ(cm)</th>
              <td>{data.shoeSize}</td>
              <th>服のサイズ</th>
              <td>{data.uniformSize}</td>
              <th>視力(右)</th>
              <td>{data.visionRight}</td>
              <th>視力(左)</th>
              <td>{data.visionLeft}</td>
            </tr>
            <tr>
              <th>メガネ使用</th>
              <td>{data.glasses}</td>
              <th>利き腕</th>
              <td>{data.dominantArm}</td>
              <th>アレルギー</th>
              <td>{data.allergy}</td>
              <th>安全靴</th>
              <td>{data.safetyShoes}</td>
            </tr>
            <tr>
              <th>コロナワクチン</th>
              <td colSpan={7}>{data.vaccine}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Work History */}
      <div className="form-section">
        <h2>職務経歴</h2>
        <table className="info-table work-history-table">
          <thead>
            <tr>
              <th>開始</th>
              <th>終了</th>
              <th>派遣元</th>
              <th>派遣先</th>
              <th>勤務地</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            {data.jobs && data.jobs.length > 0 ? (
              data.jobs.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{formatMonthToJapanese(row.start)}</td>
                  <td>{formatMonthToJapanese(row.end)}</td>
                  <td>{row.hakenmoto}</td>
                  <td>{row.hakensaki}</td>
                  <td>{row.reason}</td>
                  <td>{row.content}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center">職務経歴はありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Family Composition */}
      <div className="form-section">
        <h2>家族構成</h2>
        <table className="info-table family-table">
          <thead>
            <tr>
              <th>氏名</th>
              <th>続柄</th>
              <th>年齢</th>
              <th>居住</th>
              <th>扶養</th>
            </tr>
          </thead>
          <tbody>
            {data.family && data.family.length > 0 ? (
              data.family.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{row.name}</td>
                  <td>{row.relation}</td>
                  <td>{row.age}</td>
                  <td>{row.residence}</td>
                  <td>{row.dependent}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">家族構成はありません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="form-footer">
        <table className="info-table">
          <tbody>
            <tr>
              <th>通勤方法</th>
              <td>{data.commuteMethod}</td>
              <th>通勤片道時間（分）</th>
              <td>{data.commuteTimeMin}</td>
              <th>お弁当（社内食堂）</th>
              <td>{data.lunchPref}</td>
            </tr>
          </tbody>
        </table>
        <div className="site-footer-content">
          <div className="footer-logo-container">
            <img src="/LOGAOUNSJP3.png" alt="ユニバーサル企画株式会社 Logo" />
            <div className="company-name">ユニバーサル企画株式会社</div>
          </div>
          <div className="company-details">
            <span>TEL 052-938-8840　FAX 052-938-8841</span>
          </div>
        </div>
      </div>

      <div className="applicant-id-footer">
        ID: {applicantId}
      </div>

      <style jsx>{`
        .rirekisho-print-container {
          width: 210mm;
          /* min-height: 297mm; */ /* Removed to allow natural content flow and pagination */
          margin: 0 auto;
          padding: 8mm;
          background: white;
          font-family: 'Noto Sans JP', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: black;
          box-sizing: border-box;
          display: block; /* Changed from flex for better page break handling */
          position: relative; /* Added for positioning context */
        }

        .applicant-id-footer {
          position: absolute;
          bottom: 8mm;
          right: 8mm;
          font-size: 8pt;
          color: #555;
        }

        .print-header {
          text-align: center;
          margin-bottom: 10px;
          page-break-after: avoid;
        }

        .print-header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0;
        }

        .form-section {
          margin-bottom: 10px;
          /* page-break-inside: avoid; <- Removed for more granular control */
        }

        .basic-info-layout {
          display: flex;
          flex-direction: row;
          align-items: stretch; /* Make children (photo and info-column) same height */
          gap: 4mm;
          page-break-inside: avoid; /* Keep this section from breaking */
        }
        
        .info-column {
          flex: 1; /* Make column fill remaining space */
          min-width: 0; /* Prevent overflow in flex context */
          display: flex;
          flex-direction: column;
        }

        .info-column > .info-table {
          flex-grow: 1; /* Allow the main table to grow vertically */
        }

        .moved-emergency-contact {
          margin-top: 4px;
          margin-bottom: 0;
        }

        .moved-emergency-contact h2 {
          margin-top: 0;
        }

        .documents-section .info-table th,
        .documents-section .info-table td {
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .form-section h2 {
          font-size: 11pt;
          font-weight: bold;
          margin-bottom: 4px;
          margin-top: 8px;
          page-break-after: avoid; /* Avoid breaking right after a heading */
        }

        .photo-container {
          flex-shrink: 0;
          width: 35mm;
          height: 45mm;
        }

        .photo-frame {
          width: 100%;
          height: 100%;
          border: 1px solid black;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          color: #999;
          font-size: 9pt;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          page-break-inside: auto; /* Allow tables to break */
        }

        .info-table th,
        .info-table td {
          border: 1px solid black;
          padding: 4px 6px;
          font-size: 8.5pt; /* Slightly adjusted font size */
          text-align: left;
          vertical-align: middle;
          word-wrap: break-word;
          height: 18px; /* Increased row height */
        }

        /* Taller rows for personal info next to photo */
        .personal-info-table .tall-row th,
        .personal-info-table .tall-row td {
          height: 22px; /* Even taller for personal info */
          padding: 6px 8px;
        }

        /* Taller rows for work history and family sections */
        .work-history-table th,
        .work-history-table td,
        .family-table th,
        .family-table td {
          height: 20px; /* Slightly taller rows */
        }

        .info-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .info-table thead {
          display: table-header-group; /* Repeat headers on page break */
        }

        .info-table tbody tr {
          page-break-inside: avoid; /* Avoid breaking a single row */
        }

        .grid-2-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px;
        }

        .qualifications-container {
          border: 1px solid black;
          padding: 5px;
          page-break-inside: avoid;
        }

        .qualification-row {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          align-items: center;
        }

        .qualification-label {
          font-size: 9pt;
          white-space: nowrap;
        }

        .qualification-level {
          font-size: 8pt;
          color: #666;
        }

        /* Company name styling */
        .company-name {
          font-size: 11pt;
          font-weight: bold;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          margin-top: 5px;
          text-align: center;
        }

        /* Footer logo container */
        .footer-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .footer-logo-container img {
          max-height: 45px; /* Larger logo */
          width: auto;
          background: transparent !important;
          mix-blend-mode: multiply;
        }

        .form-footer {
          margin-top: auto;
          padding-top: 10px;
          page-break-before: auto;
          page-break-inside: avoid; /* Keep footer from breaking */
        }

        /* Emergency contact section styling */
        .emergency-contact-section {
          margin-bottom: 10px;
          page-break-inside: avoid;
        }

        .emergency-contact-section h2 {
          font-size: 11pt;
          font-weight: bold;
          margin-bottom: 4px;
          margin-top: 8px;
          page-break-after: avoid;
        }

        .site-footer-content {
          margin-top: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px; /* Reduced gap for compactness */
        }

        .company-details {
          font-size: 10pt; /* Slightly larger font */
          display: flex;
          flex-direction: column;
          text-align: right;
        }

        .footer-logo-container img {
          max-height: 45px; /* Larger logo */
          width: auto;
          background: transparent !important;
          mix-blend-mode: multiply;
        }

        .text-center {
          text-align: center;
        }

        @page {
          size: A4 portrait;
          margin: 0; /* Remove browser default header/footer */
        }

        @media print {
          html, body {
            background: #fff !important;
            font-family: 'Noto Sans JP', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .rirekisho-print-container {
            margin: 0 !important;
            padding: 12mm !important; /* Create our own margin */
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
          }
          .info-table th,
          .info-table td {
            font-size: 8pt !important;
            padding: 3px 5px !important; /* Increased padding for print */
            height: 16px !important; /* Explicit row height for print */
            line-height: 1.4 !important; /* Better line spacing */
          }

          /* Taller rows for personal info next to photo in print */
          .personal-info-table .tall-row th,
          .personal-info-table .tall-row td {
            height: 20px !important; /* Even taller for personal info in print */
            padding: 5px 7px !important;
          }
          .info-table th {
             background-color: #f0f0f0 !important;
          }
          
          /* Footer specific print styles */
          .site-footer-content {
            justify-content: center !important;
            align-items: center !important;
            gap: 12px !important; /* Compact gap for print */
          }
          
          .company-details {
            text-align: right !important;
            font-size: 9pt !important; /* Slightly larger for print */
          }
          
          .footer-logo-container img {
            background: transparent !important;
            mix-blend-mode: multiply !important;
            opacity: 1 !important;
            max-height: 40px !important; /* Optimized size for print */
          }

          /* Emergency contact section print styles */
          .emergency-contact-section {
            margin-bottom: 8px !important;
            page-break-inside: avoid !important;
          }

          .emergency-contact-section h2 {
            font-size: 10pt !important;
            font-weight: bold !important;
            margin-bottom: 3px !important;
            margin-top: 6px !important;
            page-break-after: avoid !important;
          }

          /* Qualifications row styling for print */
          .qualification-row {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
            align-items: center !important;
          }

          .qualification-label {
            font-size: 8pt !important;
            white-space: nowrap !important;
          }

          .qualification-level {
            font-size: 7pt !important;
            color: #666 !important;
          }

          /* Company name styling for print */
          .company-name {
            font-size: 10pt !important;
            font-weight: bold !important;
            font-family: 'Helvetica Neue', Arial, sans-serif !important;
            margin-top: 4px !important;
            text-align: center !important;
          }

          /* Footer logo container for print */
          .footer-logo-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 4px !important;
          }

          .footer-logo-container img {
            max-height: 40px !important; /* Larger logo for print */
            width: auto !important;
            background: transparent !important;
            mix-blend-mode: multiply !important;
          }

          /* Taller rows for work history and family sections in print */
          .work-history-table th,
          .work-history-table td,
          .family-table th,
          .family-table td {
            height: 18px !important; /* Slightly taller rows for print */
          }

          /* Applicant ID styling for print */
          .applicant-id-footer {
            position: absolute !important;
            bottom: 8mm !important;
            right: 8mm !important;
            font-size: 8pt !important;
            color: #555 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RirekishoPrintView;
