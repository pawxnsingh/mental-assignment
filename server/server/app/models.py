from django.db import models
import uuid
from pgvector.django import VectorField

# Create your models here.
# some of the model that i've in my head is
# 1. patient model, containing the name, image, age, dob, medical history, everything related to the patient, will ask gpt
#    - Users can input information about their patient

# 2. another is for the dataset that i'll be download from the internets(mental health dataset), its need to be cleaned data 
#    - something like id, context, context_embedding, response, response_embeddings, , created_at
# 3. storing the question and asked and allowing user to create chat threads
# 4. 

class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=[('Male', 'Male'), ('Female', 'Female')], null=True, blank=True)
    diagnosis = models.TextField(null=True, blank=True) # allowing counselar 
    created_at = models.DateTimeField(auto_now_add=True)

class CounselingTranscript(models.Model):
    context = models.TextField()  # Patient statement
    response = models.TextField()  # Counselor's response
    embedding = VectorField(dimensions=1536)  # PGVector storing embeddings

    def __str__(self):
        return self.context[:50]
    

class ChatThread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="Thread title or subject")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="messages")
    patient = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name="messages")
    response = models.CharField(help_text="Response that")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)