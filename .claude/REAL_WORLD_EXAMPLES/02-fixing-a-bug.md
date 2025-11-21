# 📚 Real World Example #2: Fixing a Bug

**Complete walkthrough of debugging and fixing a login issue**

---

## 🎯 The Problem

```
User: "Users report random 401 Unauthorized errors during login.
Error happens ~10% of the time. It's intermittent.
Started after we updated JWT library."
```

---

## 🔄 Claude Code's Workflow

### Step 1: Create Todo List

```
[ ] Collect error logs and reproduce issue
[ ] Analyze root cause
[ ] Implement fix
[ ] Write regression tests
[ ] Verify fix works
```

---

### Step 2: Delegate to Bug Hunter

```
Task(
    subagent_type="general-purpose",
    description="Debug login 401 errors",
    prompt="""
    You are the bug-hunter specialist.

    Problem: Users get random 401 Unauthorized during login (~10% of time)

    Observations:
    - Started after JWT library update (PyJWT X.Y.Z → A.B.C)
    - Error is intermittent (not 100% reproducible)
    - Affects all users
    - No pattern in timing

    Error log:
    [Paste error logs]

    Current code (simplified):
    ```python
    @router.post("/login")
    async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
        user = await authenticate_user(data.email, data.password, db)
        if not user:
            raise HTTPException(status_code=401)
        token = create_access_token(user.id)
        return {"access_token": token}
    ```

    JWT implementation:
    [Show current JWT creation code]

    Please:
    1. Identify root cause
    2. Propose fix
    3. Verify fix works
    """
)
```

---

### Step 3: Bug Hunter's Analysis

**Root Cause Found:** JWT library update changed behavior for token refresh.
The old version had a bug where it would re-sign tokens. New version doesn't.
When old tokens reached the middleware, they failed validation.

**Fix:**
```python
# Old code (broken)
def create_access_token(user_id: int):
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# New code (fixed)
def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "iat": datetime.utcnow(),  # ← Add issued-at timestamp
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token  # ← Return string directly, not dict
```

---

### Step 4: Testing the Fix

Claude Code invokes testing-qa:

```
Task(
    subagent_type="general-purpose",
    description="Test JWT fix with 1000 concurrent logins",
    prompt="""
    Test the JWT fix with stress testing.

    Requirements:
    1. Create 1000 test users
    2. Simulate 100 concurrent logins
    3. Verify all succeed (0% failure rate)
    4. Verify tokens are valid
    5. Verify old tokens are rejected

    Also test:
    - Token refresh works
    - Token expiration works
    - Invalid tokens rejected
    """
)
```

**Results:** All 1000 logins succeed, 0% failure rate ✅

---

### Step 5: Regression Test

```python
@pytest.mark.asyncio
async def test_login_succeeds_under_load(client, db_session):
    """Test 1000 concurrent logins all succeed"""
    import asyncio

    async def login_user(email: str, password: str):
        response = client.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert response.status_code == 200
        return response.json()["access_token"]

    # Create test users
    for i in range(1000):
        user = models.User(email=f"user{i}@test.com", password_hash=...)
        db_session.add(user)
    await db_session.commit()

    # Concurrent logins
    tasks = [
        login_user(f"user{i}@test.com", "password")
        for i in range(1000)
    ]

    tokens = await asyncio.gather(*tasks)

    assert len(tokens) == 1000
    assert all(t for t in tokens)  # All non-empty
```

**Test passes:** ✅

---

## 📊 Summary

| Phase | Result |
|-------|--------|
| **Problem** | 401 errors after JWT update |
| **Root Cause** | JWT token format changed in new library |
| **Fix** | Update token creation to match new format |
| **Test** | 1000 concurrent logins, 0% failure |
| **Status** | ✅ Fixed and verified |

---

## 🎓 Key Takeaway

When bugs are intermittent and hard to reproduce:
1. Analyze recent changes (updates, deployments)
2. Review error logs thoroughly
3. Test with stress/load testing
4. Add regression tests to prevent recurrence

**Bug fixed in 1 hour with AI coordination!** 🚀
