from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class StrictJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user is None:
            return None
        
        token_version = validated_token.get('session_version')
        if not token_version or str(user.session_version) != str(token_version):
            raise AuthenticationFailed('Session expired. Logged in from another device.')
            
        return user
