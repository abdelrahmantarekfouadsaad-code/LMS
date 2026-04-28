from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/complaints/$', consumers.ComplaintsConsumer.as_asgi()),
    re_path(r'ws/chat/homework/(?P<room_id>[\w-]+)/$', consumers.HomeworkConsumer.as_asgi()),
    re_path(r'ws/chat/community/(?P<study_group_id>[\w-]+)/$', consumers.CommunityConsumer.as_asgi()),
]
