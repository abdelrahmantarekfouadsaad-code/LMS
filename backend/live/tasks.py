import requests
import os
from celery import shared_task
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Zoom Server-to-Server OAuth Credentials
# In production, these should be loaded from environment variables
ZOOM_ACCOUNT_ID = os.environ.get('ZOOM_ACCOUNT_ID', 'placeholder_account_id')
ZOOM_CLIENT_ID = os.environ.get('ZOOM_CLIENT_ID', 'placeholder_client_id')
ZOOM_CLIENT_SECRET = os.environ.get('ZOOM_CLIENT_SECRET', 'placeholder_client_secret')

def get_zoom_access_token():
    """ Retrieves a valid Zoom API token via Server-to-Server OAuth """
    url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={ZOOM_ACCOUNT_ID}"
    auth = (ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)
    response = requests.post(url, auth=auth)
    
    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        logger.error(f"Failed to get Zoom token: {response.text}")
        return None

@shared_task
def create_zoom_meeting_task(session_id):
    """
    Asynchronously creates a Zoom meeting and updates the LiveSession model.
    """
    # Delay import to avoid circular dependencies
    from live.models import LiveSession
    
    try:
        session = LiveSession.objects.get(id=session_id)
    except LiveSession.DoesNotExist:
        logger.error(f"LiveSession {session_id} not found.")
        return False

    token = get_zoom_access_token()
    if not token:
        logger.error("Zoom meeting creation aborted due to missing token.")
        return False

    # Standard Zoom user meeting creation endpoint (Using 'me' requires user-level OAuth,
    # for S2S OAuth, we usually create meetings for a specific user email under the account)
    # Using 'me' is fine if the S2S token is granted impersonation rights, or we explicitly pass the teacher's email.
    teacher_email = session.teacher.email
    url = f"https://api.zoom.us/v2/users/{teacher_email}/meetings"

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # Format the start time to ISO 8601 string format required by Zoom (e.g., "2023-11-20T10:00:00Z")
    start_time_str = session.scheduled_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "topic": session.title,
        "type": 2, # Scheduled meeting
        "start_time": start_time_str,
        "duration": 60, # Defaulting to 60 mins
        "timezone": "UTC",
        "settings": {
            "host_video": True,
            "participant_video": True,
            "join_before_host": False,
            "mute_upon_entry": True,
            "waiting_room": True,
            "auto_recording": "cloud"
        }
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 201:
        data = response.json()
        session.zoom_join_url = data.get('join_url')
        session.zoom_start_url = data.get('start_url')
        session.zoom_meeting_id = str(data.get('id'))
        session.zoom_passcode = data.get('password')
        session.save()
        logger.info(f"Successfully created Zoom meeting for session {session_id}")
        return True
    else:
        logger.error(f"Failed to create Zoom meeting: {response.text}")
        return False
