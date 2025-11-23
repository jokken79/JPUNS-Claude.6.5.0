"""
Database Management API Endpoints
"""
import csv
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect, MetaData, Table, select, func, String
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.services.auth_service import AuthService

router = APIRouter()


def _get_table_safely(db: Session, table_name: str) -> Table:
    """
    Safely get a SQLAlchemy Table object using reflection.
    Prevents SQL injection by validating table name exists.
    """
    inspector = inspect(db.bind)
    if table_name not in inspector.get_table_names():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table '{table_name}' not found"
        )

    metadata = MetaData()
    table = Table(table_name, metadata, autoload_with=db.bind)
    return table


@router.get("/tables")
async def get_tables(
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get all tables with their info
    """
    try:
        inspector = inspect(db.bind)
        if not inspector:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create database inspector"
            )
        tables = inspector.get_table_names()
        
        table_info = []
        for table_name in tables:
            # Get row count using SQLAlchemy (prevents SQL injection)
            table = _get_table_safely(db, table_name)
            result = db.execute(select(func.count()).select_from(table))
            row_count = result.scalar()

            # Get column info
            columns = inspector.get_columns(table_name) if inspector else []
            column_info = [
                {
                    "name": col["name"],
                    "type": str(col["type"]),
                    "nullable": col["nullable"],
                    "default": str(col["default"]) if col["default"] else None
                }
                for col in columns
            ]
            
            table_info.append({
                "name": table_name,
                "rowCount": row_count,
                "columns": column_info
            })
        
        return table_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tables: {str(e)}"
        )


@router.get("/tables/{table_name}/data")
async def get_table_data(
    table_name: str,
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get table data with pagination and search
    """
    try:
        # Validate table name
        inspector = inspect(db.bind)
        if not inspector or table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        # Get columns
        columns = [col["name"] for col in inspector.get_columns(table_name)] if inspector else []
        
        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero"
            )
        if offset < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offset cannot be negative"
            )

        # Use SQLAlchemy Table reflection to prevent SQL injection
        table = _get_table_safely(db, table_name)

        # Build query using SQLAlchemy (prevents SQL injection)
        query_obj = select(table).limit(limit).offset(offset)
        count_query_obj = select(func.count()).select_from(table)

        if search:
            # Build search conditions using SQLAlchemy
            search_conditions = []
            for col in table.columns:
                try:
                    search_conditions.append(col.cast(String).ilike(f"%{search}%"))
                except (TypeError, ValueError):  # pragma: no cover - defensive fallback
                    continue
            if search_conditions:
                from sqlalchemy import or_
                search_filter = or_(*search_conditions)
                query_obj = query_obj.where(search_filter)
                count_query_obj = count_query_obj.where(search_filter)

        # Execute queries (now using SQLAlchemy - SQL injection safe)
        result = db.execute(query_obj)
        rows = result.mappings().all()

        count_result = db.execute(count_query_obj)
        total_count = count_result.scalar()

        # Convert to dict format
        data_rows = [dict(row) for row in rows]
        
        return {
            "columns": columns,
            "rows": data_rows,
            "totalCount": total_count,
            "page": (offset // limit) + 1,
            "pageSize": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch table data: {str(e)}"
        )


@router.get("/tables/{table_name}/export")
async def export_table(
    table_name: str,
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Export table data as CSV
    """
    try:
        # Get table safely (prevents SQL injection)
        table = _get_table_safely(db, table_name)

        # Get all data using SQLAlchemy (SQL injection safe)
        result = db.execute(select(table))
        rows = result.fetchall()
        columns = [col.name for col in table.columns]
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(columns)
        
        # Write data
        for row in rows:
            writer.writerow(row)
        
        # Create response
        output.seek(0)
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={table_name}_export.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export table: {str(e)}"
        )


@router.post("/tables/{table_name}/import")
async def import_table(
    table_name: str,
    file: UploadFile = File(...),
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Import data to table from CSV/Excel file (including .xlsm with macros)
    Supports hidden columns and all Excel formats
    """
    try:
        # Validate table name
        inspector = inspect(db.bind)
        if not inspector or table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )

        # Get table columns
        columns = [col["name"] for col in inspector.get_columns(table_name)] if inspector else []

        # Read file
        content = await file.read()

        if file.filename and file.filename.endswith('.csv'):
            # Read CSV
            df = pd.read_csv(io.StringIO(content.decode('utf-8-sig')))
        elif file.filename and file.filename.endswith(('.xlsx', '.xls', '.xlsm')):
            # Read Excel (including .xlsm with macros)
            # engine='openpyxl' supports .xlsx and .xlsm (with macros)
            # Keep hidden columns by not using usecols parameter
            df = pd.read_excel(
                io.BytesIO(content),
                engine='openpyxl',
                sheet_name=0  # Read first sheet (can be modified to read all sheets)
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please use CSV, Excel (.xlsx, .xls, or .xlsm) files."
            )
        
        # Validate columns
        if not all(col in df.columns for col in columns if col != 'id'):
            missing_cols = [col for col in columns if col != 'id' and col not in df.columns]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_cols}"
            )
        
        # Insert data
        inserted_count = 0
        for _, row in df.iterrows():
            try:
                # Prepare data for insertion
                insert_data = {}
                for col in columns:
                    if col != 'id' and col in row:
                        # Handle values safely - convert to list first to avoid pandas Series issues
                        try:
                            # Convert pandas Series to list to avoid indexing issues
                            if hasattr(row, 'iloc'):
                                # It's a pandas Series, get the value by position
                                col_index = list(row.index).index(col)
                                value = row.iloc[col_index]
                            else:
                                # It's already a dict-like object
                                value = row[col]
                            
                            # Simple null check
                            if value is None or (isinstance(value, float) and value != value):
                                insert_data[col] = None
                            else:
                                insert_data[col] = value
                        except (KeyError, TypeError, AttributeError, ValueError, IndexError):
                            # Skip if column doesn't exist or value is invalid
                            continue
                
                if insert_data:
                    # Build insert query
                    cols = list(insert_data.keys())
                    values = list(insert_data.values())
                    placeholders = [f":{i}" for i in range(len(values))]
                    
                    query = f"INSERT INTO {table_name} ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"
                    # Create parameter dict with string keys
                    param_dict = {f"param_{i}": val for i, val in enumerate(values)}
                    placeholders = [f":param_{i}" for i in range(len(values))]
                    query = f"INSERT INTO {table_name} ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"
                    db.execute(text(query), param_dict)
                    inserted_count += 1
            except Exception as e:
                # Skip row if error occurs
                continue
        
        db.commit()
        
        return {
            "message": f"Successfully imported {inserted_count} rows to {table_name}",
            "insertedCount": inserted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import data: {str(e)}"
        )


@router.put("/tables/{table_name}/rows/{row_id}")
async def update_row(
    table_name: str,
    row_id: str,
    update_data: Dict[str, Any],
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Update a specific cell in a table row
    """
    try:
        # Validate table name
        inspector = inspect(db.bind)
        if not inspector or table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        column_name = update_data.get("column")
        new_value = update_data.get("value")
        
        if not column_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Column name is required"
            )
        
        # Validate column exists
        columns = [col["name"] for col in inspector.get_columns(table_name)] if inspector else []
        if column_name not in columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Column '{column_name}' not found in table '{table_name}'"
            )
        
        # Update query
        query = f"UPDATE {table_name} SET {column_name} = :value WHERE id = :id"
        db.execute(text(query), {"value": new_value, "id": row_id})
        db.commit()
        
        return {"message": "Row updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update row: {str(e)}"
        )


@router.delete("/tables/{table_name}/rows/{row_id}")
async def delete_row(
    table_name: str,
    row_id: str,
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Delete a row from a table
    """
    try:
        # Validate table name
        inspector = inspect(db.bind)
        if not inspector or table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )
        
        # Delete query
        query = f"DELETE FROM {table_name} WHERE id = :id"
        result = db.execute(text(query), {"id": row_id})
        db.commit()
        
        # Check if any rows were affected
        if db.execute(text(f"SELECT COUNT(*) FROM {table_name} WHERE id = :id"), {"id": row_id}).scalar() == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Row with id '{row_id}' not found in table '{table_name}'"
            )
        
        return {"message": "Row deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete row: {str(e)}"
        )


@router.delete("/tables/{table_name}/truncate")
async def truncate_table(
    table_name: str,
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Delete ALL rows from a table (TRUNCATE)
    """
    try:
        # Validate table name
        inspector = inspect(db.bind)
        if not inspector or table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found"
            )

        # Get row count before truncate
        count_result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        row_count_before = count_result.scalar()

        # Truncate table (keeps structure, removes all data)
        db.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE"))
        db.commit()

        return {
            "message": f"Successfully deleted all rows from '{table_name}'",
            "rowsDeleted": row_count_before
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to truncate table: {str(e)}"
        )


@router.post("/tables/{table_name}/create")
async def create_table(
    table_name: str,
    table_schema: Dict[str, Any],
    current_user = Depends(AuthService.require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Create a new table (admin only)
    """
    try:
        # Validate table name doesn't exist
        inspector = inspect(db.bind)
        if inspector and table_name in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table '{table_name}' already exists"
            )

        # Build CREATE TABLE query
        columns_def = []
        for col_name, col_def in table_schema.get("columns", {}).items():
            col_type = col_def.get("type", "TEXT")
            nullable = "NOT NULL" if not col_def.get("nullable", True) else ""
            default = f"DEFAULT {col_def['default']}" if col_def.get("default") else ""
            columns_def.append(f"{col_name} {col_type} {nullable} {default}".strip())

        # Add primary key if not exists
        if "id" not in table_schema.get("columns", {}):
            columns_def.insert(0, "id SERIAL PRIMARY KEY")

        query = f"CREATE TABLE {table_name} ({', '.join(columns_def)})"
        db.execute(text(query))
        db.commit()

        return {"message": f"Table '{table_name}' created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create table: {str(e)}"
        )