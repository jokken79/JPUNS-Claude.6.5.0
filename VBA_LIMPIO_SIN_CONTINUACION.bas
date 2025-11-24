' ============================================================================
' ARCHIVO: VBA_CORREGIDO_LIMPIO.bas
' DESCRIPCION: Macros corregidas para 賃金台帳 (Libro de Salarios)
' VERSION: Limpia sin guiones bajos de continuacion
' ============================================================================

Option Explicit

' ============================================================================
' FUNCIONES AUXILIARES FALTANTES
' ============================================================================

Private Function IsNumeric(val As Variant) As Boolean
    On Error Resume Next
    IsNumeric = (val <> "") And (Not IsError(CDbl(val)))
    On Error GoTo 0
End Function

' ============================================================================
' MODULO: ChinginMaster_P1 - Crear Plantilla
' ============================================================================

Public Sub CrearPlantillaChingin()
    Dim ws As Worksheet
    Dim meses As Variant, filas As Variant
    Dim i As Long, filaActual As Long
    Dim filaMes As Long, colMes As Long, filaPrimeraFila As Long
    Dim ultimaCol As Long, c As Long

    Set ws = ActiveSheet
    ws.Cells.Clear

    ws.Range("B3").Value = Year(Date) & "年 賃金台帳"
    With ws.Range("B3")
        .Font.Size = 16
        .Font.Bold = True
    End With

    ws.Range("B5").Value = "従業員番号"
    ws.Range("B7").Value = "氏名"
    ws.Range("B8").Value = "派遣先"
    ws.Range("B9").Value = "所属先"
    ws.Range("D5").Value = "生年月日"
    ws.Range("D6").Value = "入社日"
    ws.Range("D7").Value = "性別"

    filaMes = 11
    colMes = 3
    filaPrimeraFila = 12

    meses = Array("1月分", "2月分", "3月分", "4月分", "5月分", "6月分", "7月分", "8月分", "9月分", "10月分", "11月分", "12月分", "合計")

    For i = 0 To UBound(meses)
        ws.Cells(filaMes, colMes + i).Value = meses(i)
    Next i

    Dim filas_data As Variant
    filas_data = Array("支給分", "賃金計算期間", "出勤日数", "休日出勤日数", "欠勤日数", "有休日数", "特別休暇日数", "実働時間", "残業時間数", "休日労働時間数", "深夜労働時間数", "基本給 (月給)", "基本給 (日給)", "基本給 (時給)", "その他手当１", "その他手当２", "その他手当３", "その他手当４", "その他手当５", "課税支給合計", "非課税支給合計", "支給合計", "健康保険料", "厚生年金保険料", "雇用保険料", "住民税", "所得税", "財形貯蓄", "組合費", "その他", "控除合計", "年末調整還付", "年末調整徴収", "差引支給額")

    filaActual = filaPrimeraFila
    For i = 0 To UBound(filas_data)
        ws.Cells(filaActual, 2).Value = filas_data(i)
        filaActual = filaActual + 1
    Next i

    ultimaCol = colMes + UBound(meses)

    With ws.Range(ws.Cells(filaMes, 2), ws.Cells(filaActual - 1, ultimaCol))
        .Font.Name = "ＭＳ ゴシック"
        .Font.Size = 9
        .Borders.LineStyle = xlContinuous
        .HorizontalAlignment = xlCenter
        .VerticalAlignment = xlCenter
    End With

    ws.Range(ws.Cells(filaPrimeraFila, 2), ws.Cells(filaActual - 1, 2)).HorizontalAlignment = xlLeft

    ws.Columns(2).ColumnWidth = 18
    For c = colMes To ultimaCol
        ws.Columns(c).ColumnWidth = 12
    Next c

    On Error Resume Next
    ws.Name = Year(Date) & "年 賃金台帳"
    On Error GoTo 0

End Sub

' ============================================================================
' MODULO: ChinginMaster_P2 - Importar desde Kintai
' ============================================================================

Public Function GetOrCreateALL() As Worksheet
    Dim ws As Worksheet
    Dim wsALL As Worksheet
    
    On Error Resume Next
    Set wsALL = ThisWorkbook.Worksheets("ALL")
    On Error GoTo 0
    
    If wsALL Is Nothing Then
        Set wsALL = ThisWorkbook.Worksheets.Add
        wsALL.Name = "ALL"
        
        wsALL.Range("A1").Value = "年"
        wsALL.Range("B1").Value = "月"
        wsALL.Range("C1").Value = "従業員番号"
        wsALL.Range("D1").Value = "氏名ローマ字"
        wsALL.Range("E1").Value = "氏名"
        wsALL.Range("F1").Value = "支給分"
        wsALL.Range("G1").Value = "派遣先"
        wsALL.Range("H1").Value = "期間開始"
        wsALL.Range("I1").Value = "期間終了"
        wsALL.Range("J1").Value = "出勤日数"
        wsALL.Range("K1").Value = "欠勤日数"
        wsALL.Range("L1").Value = "有給日数"
        wsALL.Range("M1").Value = "早退"
        wsALL.Range("N1").Value = "実働時"
        wsALL.Range("O1").Value = "実働分"
        wsALL.Range("P1").Value = "残業時"
        wsALL.Range("Q1").Value = "残業分"
        wsALL.Range("R1").Value = "深夜時"
        wsALL.Range("S1").Value = "深夜分"
        wsALL.Range("T1").Value = "基本給(時給)"
        wsALL.Range("U1").Value = "普通残業手当"
        wsALL.Range("V1").Value = "深夜残業手当"
        wsALL.Range("W1").Value = "休日勤務"
        wsALL.Range("X1").Value = "有給休暇"
        wsALL.Range("Y1").Value = "予備1"
        wsALL.Range("Z1").Value = "前月給与"
        wsALL.Range("AA1").Value = "合計"
        wsALL.Range("AB1").Value = "健康保険料"
        wsALL.Range("AC1").Value = "厚生年金保険料"
        wsALL.Range("AD1").Value = "雇用保険料"
        wsALL.Range("AE1").Value = "社会保険料計"
        wsALL.Range("AF1").Value = "住民税"
        wsALL.Range("AG1").Value = "所得税"
        wsALL.Range("AH1").Value = "その他控除"
        wsALL.Range("AI1").Value = "控除1"
        wsALL.Range("AJ1").Value = "控除2"
        wsALL.Range("AK1").Value = "控除合計"
        wsALL.Range("AL1").Value = "差引支給額"
        wsALL.Range("AM1").Value = "通勤手当(非)"
        
        With wsALL.Range("A1:AM1")
            .Font.Bold = True
            .Interior.Color = RGB(200, 200, 200)
        End With
    End If
    
    Set GetOrCreateALL = wsALL
End Function

Public Sub GenerarALL_DesdeKintai()
    Dim folderPath As String
    Dim fileName As String
    Dim wb As Workbook
    Dim wsALL As Worksheet

    Set wsALL = GetOrCreateALL()

    wsALL.Range("A2:AM99999").ClearContents

    With Application.FileDialog(msoFileDialogFolderPicker)
        .Title = "フォルダを選択してください (勤怠表)"
        If .Show <> -1 Then Exit Sub
        folderPath = .SelectedItems(1)
    End With

    Application.ScreenUpdating = False
    Application.EnableEvents = False

    fileName = Dir(folderPath & "\*.xlsm")

    Do While fileName <> ""
        If InStr(fileName, "従業員賃金計算用") > 0 Or InStr(fileName, "請負") > 0 Then
            Set wb = Workbooks.Open(folderPath & "\" & fileName)
            Call Procesar_Un_Kintai(wb, wsALL)
            wb.Close False
        End If
        fileName = Dir()
    Loop

    Application.ScreenUpdating = True
    Application.EnableEvents = True

    MsgBox "ALL が更新されました。", vbInformation
End Sub

Private Sub Procesar_Un_Kintai(wb As Workbook, wsALL As Worksheet)
    Dim ws As Worksheet
    Dim shPay As Worksheet
    Dim fila As Long

    Set shPay = Nothing
    For Each ws In wb.Worksheets
        If InStr(ws.Name, "給料明細") > 0 Then
            Set shPay = ws
            Exit For
        End If
    Next ws

    If shPay Is Nothing Then Exit Sub

    fila = wsALL.Cells(wsALL.Rows.Count, 1).End(xlUp).Row + 1

    wsALL.Cells(fila, 1).Value = ExtractYear(CStr(shPay.Range("C5").Value))
    wsALL.Cells(fila, 2).Value = ExtractMonth(CStr(shPay.Range("C5").Value))

    wsALL.Cells(fila, 3).Value = shPay.Range("J6").Value
    wsALL.Cells(fila, 4).Value = shPay.Range("C7").Value
    wsALL.Cells(fila, 5).Value = CleanName(CStr(shPay.Range("C8").Value))
    wsALL.Cells(fila, 6).Value = shPay.Range("C5").Value
    wsALL.Cells(fila, 7).Value = GetHakenName(wb)

    wsALL.Cells(fila, 8).Value = shPay.Range("D10").Value
    wsALL.Cells(fila, 9).Value = shPay.Range("I10").Value

    wsALL.Cells(fila, 10).Value = shPay.Range("F11").Value
    wsALL.Cells(fila, 11).Value = shPay.Range("K11").Value
    wsALL.Cells(fila, 12).Value = shPay.Range("F12").Value

    wsALL.Cells(fila, 13).Value = shPay.Range("D13").Value
    wsALL.Cells(fila, 14).Value = shPay.Range("J13").Value
    wsALL.Cells(fila, 15).Value = shPay.Range("J13").Value

    wsALL.Cells(fila, 16).Value = shPay.Range("D14").Value
    wsALL.Cells(fila, 17).Value = shPay.Range("J14").Value

    wsALL.Cells(fila, 18).Value = shPay.Range("D15").Value
    wsALL.Cells(fila, 19).Value = shPay.Range("J15").Value

    wsALL.Cells(fila, 20).Value = shPay.Range("D16").Value
    wsALL.Cells(fila, 21).Value = shPay.Range("D17").Value
    wsALL.Cells(fila, 22).Value = shPay.Range("D18").Value
    wsALL.Cells(fila, 23).Value = shPay.Range("D19").Value
    wsALL.Cells(fila, 24).Value = shPay.Range("D21").Value

    wsALL.Cells(fila, 25).Value = ""
    wsALL.Cells(fila, 26).Value = shPay.Range("D29").Value
    wsALL.Cells(fila, 27).Value = shPay.Range("D30").Value

    wsALL.Cells(fila, 28).Value = shPay.Range("D31").Value
    wsALL.Cells(fila, 29).Value = shPay.Range("D32").Value
    wsALL.Cells(fila, 30).Value = shPay.Range("D33").Value
    wsALL.Cells(fila, 31).Value = shPay.Range("D34").Value
    wsALL.Cells(fila, 32).Value = shPay.Range("D35").Value
    wsALL.Cells(fila, 33).Value = shPay.Range("D36").Value

    wsALL.Cells(fila, 34).Value = Extract_Others(shPay)

    wsALL.Cells(fila, 35).Value = shPay.Range("D46").Value
    wsALL.Cells(fila, 36).Value = ""

    wsALL.Cells(fila, 37).Value = shPay.Range("D46").Value
    wsALL.Cells(fila, 38).Value = shPay.Range("D47").Value

    wsALL.Cells(fila, 39).Value = Find_Tuukin_Hi(shPay)

End Sub

' ============================================================================
' FUNCIONES AUXILIARES
' ============================================================================

Private Function ExtractYear(v As String) As Long
    On Error Resume Next
    ExtractYear = Val(Left(v, 4))
    On Error GoTo 0
End Function

Private Function ExtractMonth(v As String) As Long
    Dim p As Long
    On Error Resume Next
    p = InStr(v, "月")
    If p > 0 Then
        ExtractMonth = Val(Mid(v, InStr(v, "年") + 1, p - InStr(v, "年") - 1))
    End If
    On Error GoTo 0
End Function

Private Function CleanName(v As String) As String
    v = Replace(v, "氏名", "")
    CleanName = Trim(v)
End Function

Private Function GetHakenName(wb As Workbook) As String
    On Error Resume Next
    GetHakenName = wb.Worksheets("派遣社員").Range("B2").Value
    On Error GoTo 0
End Function

Private Function Extract_Others(ws As Worksheet) As Double
    Dim total As Double
    Dim r As Long

    On Error Resume Next
    For r = 37 To 44
        If IsNumeric(ws.Range("D" & r).Value) Then
            total = total + CDbl(ws.Range("D" & r).Value)
        End If
    Next r
    On Error GoTo 0

    Extract_Others = total
End Function

Private Function Find_Tuukin_Hi(ws As Worksheet) As Variant
    Dim r As Long

    On Error Resume Next
    For r = 21 To 28
        If InStr(CStr(ws.Range("C" & r).Value), "通勤手当") > 0 Then
            Find_Tuukin_Hi = ws.Range("D" & r).Value
            Exit Function
        End If
    Next r
    On Error GoTo 0

    Find_Tuukin_Hi = ""
End Function

' ============================================================================
' MODULO: ChinginMaster_P3 - Rellenar desde ALL
' ============================================================================

Private Function GetCol(wsALL As Worksheet, titulo As String) As Long
    Dim c As Long
    Dim lastCol As Long
    
    On Error Resume Next
    lastCol = wsALL.Cells(1, wsALL.Columns.Count).End(xlToLeft).Column
    
    For c = 1 To lastCol
        If CStr(wsALL.Cells(1, c).Value) = titulo Then
            GetCol = c
            Exit Function
        End If
    Next c
    On Error GoTo 0
    
    GetCol = 0
End Function

Public Sub RellenarChinginDesdeALL()
    Dim ws As Worksheet
    Dim wsALL As Worksheet
    Dim emp As Variant
    Dim anio As Long
    Dim mes As Long
    Dim filaMes As Long
    Dim colMes As Long

    Set ws = ActiveSheet
    Set wsALL = GetOrCreateALL()

    emp = ws.Range("C5").Value
    If emp = "" Then
        MsgBox "従業員番号を入力してください。", vbExclamation
        Exit Sub
    End If

    anio = Year(Date)
    filaMes = 12
    colMes = 3

    For mes = 1 To 12
        ws.Cells(filaMes + 0, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "支給分")
        ws.Cells(filaMes + 1, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "期間開始")
        ws.Cells(filaMes + 2, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "出勤日数")
        ws.Cells(filaMes + 3, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "休日出勤日数")
        ws.Cells(filaMes + 4, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "欠勤日数")
        ws.Cells(filaMes + 5, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "有給日数")
        ws.Cells(filaMes + 6, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "特別休暇日数")

        ws.Cells(filaMes + 7, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "実働時")
        ws.Cells(filaMes + 8, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "残業時")
        ws.Cells(filaMes + 9, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "休日労働時間数")
        ws.Cells(filaMes + 10, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "深夜時")

        ws.Cells(filaMes + 11, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "基本給 (月給)")
        ws.Cells(filaMes + 12, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "基本給 (日給)")
        ws.Cells(filaMes + 13, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "基本給(時給)")

        ws.Cells(filaMes + 14, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "普通残業手当")
        ws.Cells(filaMes + 15, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "深夜残業手当")
        ws.Cells(filaMes + 16, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "休日勤務")
        ws.Cells(filaMes + 17, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "有給休暇")
        ws.Cells(filaMes + 18, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "通勤手当(非)")

        ws.Cells(filaMes + 19, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "支給合計")
        ws.Cells(filaMes + 20, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "通勤手当(非)")
        ws.Cells(filaMes + 21, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "控除合計")

        ws.Cells(filaMes + 22, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "健康保険料")
        ws.Cells(filaMes + 23, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "厚生年金保険料")
        ws.Cells(filaMes + 24, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "雇用保険料")
        ws.Cells(filaMes + 25, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "住民税")
        ws.Cells(filaMes + 26, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "所得税")

        ws.Cells(filaMes + 27, colMes + mes - 1).Value = ""
        ws.Cells(filaMes + 28, colMes + mes - 1).Value = ""
        ws.Cells(filaMes + 29, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "その他控除")

        ws.Cells(filaMes + 30, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "控除合計")
        ws.Cells(filaMes + 31, colMes + mes - 1).Value = ""
        ws.Cells(filaMes + 32, colMes + mes - 1).Value = ""

        ws.Cells(filaMes + 33, colMes + mes - 1).Value = GetDato(wsALL, emp, mes, "差引支給額")

    Next mes

    MsgBox "賃金台帳を更新しました。", vbInformation
End Sub

Private Function GetDato(wsALL As Worksheet, emp As Variant, mes As Long, titulo As String) As Variant
    Dim col As Long
    Dim r As Long
    Dim lastRow As Long

    col = GetCol(wsALL, titulo)
    If col = 0 Then
        GetDato = ""
        Exit Function
    End If

    lastRow = wsALL.Cells(wsALL.Rows.Count, 1).End(xlUp).Row

    For r = 2 To lastRow
        If CStr(wsALL.Cells(r, 3).Value) = CStr(emp) And CLng(wsALL.Cells(r, 2).Value) = mes Then
            GetDato = wsALL.Cells(r, col).Value
            Exit Function
        End If
    Next r

    GetDato = ""
End Function

' ============================================================================
' MODULO: Buttons - Crear Botones
' ============================================================================

Public Sub CrearBotonesChingin()
    Dim ws As Worksheet
    Dim btn As Shape

    Set ws = ActiveSheet

    Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, 600, 20, 120, 28)
    btn.TextFrame.Characters.Text = "勤怠取込"
    btn.OnAction = "Btn_ImportarKintai"
    Call EstiloBoton(btn)

    Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, 600, 60, 120, 28)
    btn.TextFrame.Characters.Text = "賃金台帳更新"
    btn.OnAction = "Btn_ActualizarChingin"
    Call EstiloBoton(btn)

    Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, 600, 100, 120, 28)
    btn.TextFrame.Characters.Text = "派遣社員更新"
    btn.OnAction = "Btn_ActualizarHaken"
    Call EstiloBoton(btn)

    Set btn = ws.Shapes.AddShape(msoShapeRoundedRectangle, 600, 140, 120, 28)
    btn.TextFrame.Characters.Text = "印刷"
    btn.OnAction = "Btn_ImprimirPDF"
    Call EstiloBoton(btn)

    MsgBox "ボタンを作成しました。", vbInformation

End Sub

Private Sub EstiloBoton(btn As Shape)
    With btn
        .Fill.ForeColor.RGB = RGB(60, 120, 216)
        .Line.ForeColor.RGB = RGB(20, 60, 140)
        .TextFrame.Characters.Font.Color = RGB(255, 255, 255)
        .TextFrame.Characters.Font.Size = 11
        .TextFrame.HorizontalAlignment = xlHAlignCenter
        .TextFrame.VerticalAlignment = xlVAlignCenter
    End With
End Sub

Public Sub Btn_ImportarKintai()
    Call GenerarALL_DesdeKintai
End Sub

Public Sub Btn_ActualizarChingin()
    Call RellenarChinginDesdeALL
End Sub

Public Sub Btn_ActualizarHaken()
    MsgBox "派遣社員シートを更新してください。", vbInformation
End Sub

Public Sub Btn_ImprimirPDF()
    Call ImprimirChinginPDF
End Sub

' ============================================================================
' MODULO: PrintHelper - Exportar a PDF
' ============================================================================

Public Sub ImprimirChinginPDF()
    Dim ws As Worksheet
    Dim empID As String, empName As String
    Dim ruta As String
    Dim fileName As String

    Set ws = ActiveSheet

    empID = CStr(ws.Range("C5").Value)
    empName = CStr(ws.Range("C7").Value)

    If empID = "" Then
        MsgBox "従業員番号がありません。", vbExclamation
        Exit Sub
    End If

    With ws.PageSetup
        .Orientation = xlLandscape
        .PaperSize = xlPaperA4
        .Zoom = False
        .FitToPagesWide = 1
        .FitToPagesTall = False
        .CenterHorizontally = True
        .CenterVertically = False
        .LeftMargin = Application.CentimetersToPoints(1)
        .RightMargin = Application.CentimetersToPoints(1)
        .TopMargin = Application.CentimetersToPoints(1)
        .BottomMargin = Application.CentimetersToPoints(1)
    End With

    ruta = ThisWorkbook.Path & "\PDF\"
    If Dir(ruta, vbDirectory) = "" Then MkDir ruta

    fileName = ruta & "賃金台帳_" & empID & "_" & empName & "_" & Year(Date) & ".pdf"

    On Error Resume Next
    ws.ExportAsFixedFormat Type:=xlTypePDF, fileName:=fileName, Quality:=xlQualityStandard, OpenAfterPublish:=True
    
    If Err.Number <> 0 Then
        MsgBox "PDFの作成に失敗しました: " & Err.Description, vbExclamation
        Err.Clear
    Else
        MsgBox "PDF を作成しました: " & vbCrLf & fileName, vbInformation
    End If
    On Error GoTo 0

End Sub
