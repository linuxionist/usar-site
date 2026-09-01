from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static


def spa_view(request, *args, **kwargs):
    from django.shortcuts import render
    index = settings.FRONTEND_DIR / "index.html"
    if index.exists():
        return render(request, (settings.FRONTEND_DIR / "index.html"), {})
    from django.http import JsonResponse
    return JsonResponse({"detail": "Frontend not built. Run `npm run build` in the frontend directory."}, status=503)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("operations.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += [
    re_path(r"^(?!api/|admin/|static/|media/).*$", spa_view),
]
