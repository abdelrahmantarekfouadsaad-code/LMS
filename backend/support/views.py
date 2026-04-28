from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import SupportTicket
from .serializers import SupportTicketSerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see their own tickets, admins see all.
        if self.request.user.is_superuser or self.request.user.role in ['SUPER_ADMIN', 'TECH_SUPPORT']:
            return SupportTicket.objects.all().order_by('-created_at')
        return SupportTicket.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
