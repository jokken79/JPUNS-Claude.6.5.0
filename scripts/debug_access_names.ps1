# PowerShell script to debug Access database names
# This will help understand the name mismatch in photo extraction

$AccessDBPath = "D:\ユニバーサル企画㈱データベースv25.3.24.accdb"

# Add necessary .NET assemblies for database access
Add-Type -AssemblyName System.Data.OleDb

# Connection string for Access database
$ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$AccessDBPath;"

# Create connection
$Connection = New-Object System.Data.OleDb.OleDbConnection
$Connection.ConnectionString = $ConnectionString

try {
    $Connection.Open()
    Write-Host "Connected to Access database successfully`n"

    # Create command to get column info
    $Command = New-Object System.Data.OleDb.OleDbCommand
    $Command.Connection = $Connection
    $Command.CommandText = "SELECT * FROM T_履歴書 WHERE 1=0"

    $Reader = $Command.ExecuteReader([System.Data.CommandBehavior]::SchemaOnly)
    $SchemaTable = $Reader.GetSchemaTable()

    Write-Host "Columns in T_履歴書 (first 15):`n"
    $ColumnCount = 0
    foreach ($Row in $SchemaTable.Rows) {
        $ColumnName = $Row["ColumnName"]
        Write-Host "  $ColumnCount : $ColumnName"
        $ColumnCount++
        if ($ColumnCount -ge 15) { break }
    }

    $Reader.Close()

    # Now get some actual names from column index 2
    Write-Host "`nAccess names (column index 2) - first 20 records:`n"

    $Command.CommandText = "SELECT * FROM T_履歴書 LIMIT 20"
    $Reader = $Command.ExecuteReader()

    $RecordCount = 0
    while ($Reader.Read()) {
        try {
            $Name = $Reader[2]
            if ($Name -eq [DBNull]::Value) {
                $Name = "NULL"
            }
            Write-Host "  Access[$RecordCount]: '$Name'"
        } catch {
            Write-Host "  Access[$RecordCount]: ERROR reading column"
        }
        $RecordCount++
    }

    $Reader.Close()

    # Get total count
    $Command.CommandText = "SELECT COUNT(*) FROM T_履歴書"
    $TotalCount = $Command.ExecuteScalar()
    Write-Host "`nTotal Access records: $TotalCount`n"

} catch {
    Write-Host "Error: $_"
} finally {
    $Connection.Close()
}
