from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import PaymentMethod, Subscription
from .serializers import PaymentMethodSerializer, SubscriptionSerializer

class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows payment methods to be viewed.
    Only active payment methods are returned.
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(is_active=True)

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows subscriptions to be viewed and created.
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own subscriptions, admins can see all
        user = self.request.user
        if user.is_staff:
            return Subscription.objects.all()
        return Subscription.objects.filter(user=user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        subscription = self.get_object()
        subscription.status = 'approved'
        subscription.is_active = True
        subscription.save()

        # Phase 3: Auto-join community matrix rooms upon enrollment approval
        try:
            from chat.utils import setup_student_chat_rooms
            setup_student_chat_rooms(subscription.user, subscription.course)
        except Exception as e:
            # Log but don't block approval if chat setup fails
            import logging
            logging.getLogger(__name__).warning(f"Chat room setup failed for {subscription.user}: {e}")

        return Response({'status': 'Subscription approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        subscription = self.get_object()
        subscription.status = 'rejected'
        subscription.is_active = False
        subscription.save()
        return Response({'status': 'Subscription rejected'})
