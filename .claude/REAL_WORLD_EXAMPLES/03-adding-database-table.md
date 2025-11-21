# 📚 Real World Example #3: Adding a Database Table

**Complete walkthrough of adding contracts table with migration**

---

## 🎯 The Request

```
User: "We need to add contracts management. Need a contracts table linked to employees
with contract type, dates, and status."
```

---

## 🔄 Claude Code's Workflow

### Delegate to Database Specialist

```
Task(
    subagent_type="general-purpose",
    description="Design and create contracts table",
    prompt="""
    Design and implement contracts table for employee contracts.

    Requirements:
    - Link to employees table (many contracts per employee)
    - Fields: contract_type (enum), start_date, end_date, status
    - Track: created_at, updated_at, created_by (FK to users)
    - Support multiple contract types: standard, probation, fixed-term
    - Status: active, expired, terminated, renewed
    - Support searching by employee and status

    Deliverables:
    1. SQLAlchemy model in models/models.py
    2. Alembic migration file
    3. Test for model relationships
    """
)
```

---

### Database Specialist's Output

**1. SQLAlchemy Model:**

```python
# In backend/app/models/models.py

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    contract_type = Column(
        String(50),
        nullable=False,
        default="standard"
    )  # standard, probation, fixed-term
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="active")
    terms = Column(JSON, nullable=True)  # Store terms as JSON
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    employee = relationship("Employee", back_populates="contracts")
    created_by_user = relationship("User")

    # Indexes for performance
    __table_args__ = (
        Index("ix_contract_employee_id", "employee_id"),
        Index("ix_contract_status", "status"),
        Index("ix_contract_dates", "start_date", "end_date"),
    )
```

**2. Alembic Migration:**

```python
# backend/alembic/versions/001_add_contracts_table.py

def upgrade():
    op.create_table(
        'contracts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('contract_type', sa.String(50), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('terms', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    # Create indexes
    op.create_index('ix_contract_employee_id', 'contracts', ['employee_id'])
    op.create_index('ix_contract_status', 'contracts', ['status'])
    op.create_index('ix_contract_dates', 'contracts', ['start_date', 'end_date'])

def downgrade():
    op.drop_index('ix_contract_dates', table_name='contracts')
    op.drop_index('ix_contract_status', table_name='contracts')
    op.drop_index('ix_contract_employee_id', table_name='contracts')
    op.drop_table('contracts')
```

---

### Claude Code Tests It

```bash
# Apply migration
docker exec -it uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# Verify table created
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\d contracts"

# Verify relationships work
pytest backend/tests/test_models.py::test_contract_employee_relationship -v
```

**Result:** ✅ Table created, relationships work, migration clean

---

## 📊 Summary

| Step | Owner | Result |
|------|-------|--------|
| **Design schema** | database-specialist | ✅ Complete |
| **Create migration** | database-specialist | ✅ Reversible |
| **Create indexes** | database-specialist | ✅ Performance optimized |
| **Test relationships** | testing-qa | ✅ All pass |

**Time:** 30 minutes from request to production-ready table

---

## 🎓 Key Takeaway

Database work with AI:
1. Clear schema requirements
2. Proper relationships and indexes
3. Reversible migrations
4. Comprehensive testing

**Database is the foundation — get it right!** 🏗️
