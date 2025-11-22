"""Notifications API Endpoints for UNS-ClaudeJP 2.0."""
import asyncio
import logging
from functools import partial
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.auth_service import AuthService
from app.services.notification_service import notification_service
from app.core.rate_limiter import limiter
from fastapi import Request
from app.core.cache import cache, CacheKey, CacheTTL
from app.core.response import success_response, created_response, paginated_response, no_content_response

router = APIRouter()
logger = logging.getLogger(__name__)


async def _run_blocking(func, *args, **kwargs):
    """Execute blocking notification calls without freezing the event loop."""

    loop = asyncio.get_running_loop()
    call = partial(func, *args, **kwargs)
    return success_response(data=await loop.run_in_executor(None, call), request=request)


class EmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str
    is_html: bool = True


class LINERequest(BaseModel):
    user_id: str
    message: str


class YukyuNotificationRequest(BaseModel):
    employee_email: EmailStr
    employee_name: str
    status: str
    yukyu_date: str
    line_user_id: Optional[str] = None


@router.post("/send-email")
@limiter.limit("60/minute")
async def send_email(
    request: EmailRequest,
    current_user=Depends(AuthService.require_role("admin")),
):
    """
    Send email notification
    
    Args:
        request: Email request with to, subject, body
        
    Returns:
        Success status
    """
    try:
        success = await _run_blocking(
            notification_service.send_email,
            to=request.to,
            subject=request.subject,
            body=request.body,
            is_html=request.is_html,
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        return success_response(data={"success": True, "message": "Email sent successfully"}, request=request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-line")
@limiter.limit("60/minute")
async def send_line_notification(
    request: LINERequest,
    current_user=Depends(AuthService.require_role("admin")),
):
    """
    Send LINE notification
    
    Args:
        request: LINE request with user_id and message
        
    Returns:
        Success status
    """
    try:
        success = await _run_blocking(
            notification_service.send_line_notification,
            user_id=request.user_id,
            message=request.message,
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send LINE notification")
        
        return success_response(data={"success": True, "message": "LINE notification sent"}, request=request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending LINE notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/yukyu-approval")
@limiter.limit("60/minute")
async def notify_yukyu_approval(
    request: YukyuNotificationRequest,
    current_user=Depends(AuthService.require_role("admin")),
):
    """
    Notify employee about yukyu approval
    
    Args:
        request: Yukyu notification request
        
    Returns:
        Success status
    """
    try:
        success = await _run_blocking(
            notification_service.notify_yukyu_approval,
            employee_email=request.employee_email,
            employee_name=request.employee_name,
            status=request.status,
            yukyu_date=request.yukyu_date,
            line_user_id=request.line_user_id,
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send notification")
        
        return success_response(data={"success": True, "message": "Notification sent"}, request=request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error notifying yukyu approval: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payslip-ready")
@limiter.limit("60/minute")
async def notify_payslip_ready(
    employee_email: EmailStr,
    employee_name: str,
    year: int,
    month: int,
    line_user_id: Optional[str] = None,
    current_user=Depends(AuthService.require_role("admin")),
):
    """
    Notify employee that payslip is ready
    
    Args:
        employee_email: Employee email
        employee_name: Employee name
        year: Year
        month: Month
        line_user_id: Optional LINE user ID
        
    Returns:
        Success status
    """
    try:
        success = await _run_blocking(
            notification_service.notify_payslip_ready,
            employee_email=employee_email,
            employee_name=employee_name,
            year=year,
            month=month,
            line_user_id=line_user_id,
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send notification")
        
        return success_response(data={"success": True, "message": "Payslip notification sent"}, request=request)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error notifying payslip: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-email")
@cache.cached(ttl=CacheTTL.MEDIUM)
@limiter.limit("60/minute")
async def test_email_configuration(
    current_user=Depends(AuthService.require_role("admin")),
):
    """Test email configuration"""
    try:
        test_result = await _run_blocking(
            notification_service.send_email,
            to="test@example.com",
            subject="Test Email",
            body="<p>This is a test email from UNS-ClaudeJP 2.0</p>",
            is_html=True,
        )
        
        return success_response(data={
            "success": test_result,
            "message": "Email configuration test completed"
        }, request=request)
        
    except Exception as e:
        logger.error(f"Email test failed: {e}")
        return success_response(data={
            "success": False,
            "error": str(e)
        }, request=request)
