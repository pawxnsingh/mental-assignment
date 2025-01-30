from django.urls import path
from . import views

urlpatterns = [
    path('upload-datasets/', views.upload_datasets, name="uploadDatset"),
    path('search-database/', views.search_database, name="searchDatabase"),
    path('patients/', views.patients, name="patients_related_stuff"),
    path('create-thread/',views.create_thread, name="create_thread"),
    path('chat/', views.chat, name="chat"),
    path('storeSearches/', views.storeSearches, name="store_searches"),
]
