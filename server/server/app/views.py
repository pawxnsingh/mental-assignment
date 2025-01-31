import json
from django.http import HttpRequest, HttpResponse, JsonResponse
import pandas as pd
from spellchecker import SpellChecker
from openai import OpenAI
from dotenv import load_dotenv
from app.models import CounselingTranscript, Patient, ChatThread, ChatMessage
from pgvector.django import CosineDistance
from app.constants import RESPOND_TO_MESSAGE_SYSTEM_PROMPT
import os

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=20, max_retries=0)

def chat(req:HttpRequest) -> JsonResponse:
    if req.method == "POST":
        body_bytes = req.body        
        body_str = body_bytes.decode('utf-8')
        data = json.loads(body_str)
        
        message = data['message'] # describing the challenge they are facing with the particular patients
        patient_id = data["patient_id"]
        thread_id = data["thread_id"]
        
        # get the patients details
        patient_details = Patient.objects.get(id=patient_id)
        print(patient_details)
        
        previous_messages = ChatMessage.objects.filter(
            thread_id=thread_id,
            patient_id=patient_id
        ).order_by("created_at")
        
        messages_for_openai = [
            {"role": "developer", "content": f"{RESPOND_TO_MESSAGE_SYSTEM_PROMPT.replace('{{diagnosis}}',patient_details.diagnosis)}"},
        ]
        
        for pm in previous_messages:
            messages_for_openai.append({
                "role": "developer",      
                "content": f"Here is the conversation so far for additional context. Use it to provide the most relevant and accurate response, without making up information. {pm.response}"
            })
        
        messages_for_openai.append({"role": "user", "content": f"{message}"})
        
        print(messages_for_openai)
        
        # create a padded query for llm, and return a suggestion
        # to the user on how to best help the patient how to best help the patient
        answer_response = client.chat.completions.create(
            model="gpt-4o-2024-11-20",
            messages=messages_for_openai,
            temperature=0.0,
        )
                   
        response = answer_response.choices[0].message.content
        
        ChatMessage.objects.create(
            thread_id = thread_id,
            patient_id = patient_id,
            message = message,
            response = response   
        )
        
        return JsonResponse({"response": response}, safe=False)
        
    return JsonResponse("invalid query", safe=False)

def create_thread(req:HttpRequest) -> HttpResponse:
    if req.method == "POST":
        try:
            body_bytes = req.body        
            body_str = body_bytes.decode('utf-8')
            data = json.loads(body_str)
            title = data['title']
            
            chat_thread = ChatThread.objects.create(
                title = title
            )
            
            return JsonResponse({
                "id": chat_thread.id,
                "title": chat_thread.title
            }, status=200)
        except Exception as e:
            return JsonResponse(f"Error creating thread: {str(e)}", status=500,safe=False)
    
    elif req.method == "GET":
        thread_id = req.GET.get('thread_id')
        if thread_id:
            try:
                messages = ChatMessage.objects.filter(thread_id=thread_id).values(
                    "id", "thread_id", "patient_id", "message", "response", "created_at"
                )
                return JsonResponse(list(messages), safe=False)

            except ChatMessage.DoesNotExist:
                return JsonResponse({"error": "Thread not found or no messages"}, status=404)

        threads = ChatThread.objects.all().values("id", "title", "created_at")
        return JsonResponse(list(threads), safe=False)
    
    return JsonResponse({"error": "Invalid request"}, status=400)
# route for patient inputs
def patients(req:HttpRequest) -> JsonResponse:
    # this will be used to create the new users
    if req.method == 'POST':
        try:
            body_bytes = req.body        
            body_str = body_bytes.decode('utf-8')
            data = json.loads(body_str)
        
            name = data['name']
            age = data['age']
            gender = data['gender']
            diagnosis = data['diagnosis']
            
            patient = Patient.objects.create(
                name = name, 
                age = age,
                gender = gender,
                diagnosis = diagnosis
            )
            
            return JsonResponse({
                "id": patient.id,
                "name": patient.name, 
                "age": patient.age,
                "gender": patient.gender,
                "diagnosis": patient.diagnosis
            }, status=200)
            
        except Exception as e:
            return JsonResponse(f"Error creating patient: {str(e)}", status=500,safe=False)
        
    # if id is give return that particular user
    elif req.method == 'GET':
        patient_id = req.GET.get('id')
        if patient_id:
            try:
                patient = Patient.objects.get(id=patient_id)
                return JsonResponse({
                    "id": patient.id,
                    "name": patient.name,
                    "age": patient.age,
                    "gender": patient.gender,
                    "diagnosis": patient.diagnosis
                })
            except Patient.DoesNotExist:
                return JsonResponse({"error": "Patient not found"}, status=404)

        patients = Patient.objects.all().values() 
        return JsonResponse(list(patients), safe=False)


    elif req.method == "PUT":
        try:
            # Ensure the patient ID is provided in the query parameter
            patient_id = req.GET.get('id')
            if not patient_id:
                return JsonResponse({"error": "Patient ID is required"}, status=400)

            # Load JSON data from request body
            data = json.loads(req.body)

            # Get the patient from the database
            patient = Patient.objects.get(id=patient_id)

            # Dynamically update fields if they are present in the request
            if "name" in data:
                patient.name = data["name"]
            if "age" in data:
                patient.age = data["age"]
            if "gender" in data:
                patient.gender = data["gender"]
            if "diagnosis" in data:
                patient.diagnosis = data["diagnosis"]

            patient.save()
            
            return JsonResponse({
                "id": str(patient.id),
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender,
                "diagnosis": patient.diagnosis,
                "created_at": patient.created_at.isoformat()
            })

        except Patient.DoesNotExist:
            return JsonResponse({"error": "Patient not found"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        
    elif req.method == "DELETE":
        patient_id = req.GET.get('id')
        
        if not patient_id:
            return JsonResponse({"error": "Patient ID is required"}, status=400)
        
        try:
            patient = Patient.objects.get(id=patient_id)
            patient.delete()
            return JsonResponse({"message": "Patient deleted successfully"}, status=200)
        
        except Patient.DoesNotExist:
            return JsonResponse({"error": "Patient not found"}, status=404)
        
    return JsonResponse({"error": "Invalid request"}, status=400)

def is_valid_input(text):
    spell = SpellChecker()    
    words = text.split()    
    misspelled = spell.unknown(words)
    if misspelled:
        print(f"Misspelled words: {misspelled}")
        return False  
    return True

def search_similar_chunks(query_embedding, query, limit=5):
    if not is_valid_input(query):
        return []
    
    return (
        CounselingTranscript.objects
        .annotate(distance=CosineDistance('embedding', query_embedding))
        .order_by('distance')[:limit]
    )
    
# Users can search a database that contains the mental health counseling data,
# and retrieve examples that are most relevant to their search terms
def search_database(req:HttpRequest) -> JsonResponse:
    if req.method == "POST":
        body_bytes = req.body        
        body_str = body_bytes.decode('utf-8')
        data = json.loads(body_str)
        query = data['query']
        # create the embedding of the query
        embedding_response = client.embeddings.create(model="text-embedding-3-small", input=query)
        query_embedding = embedding_response.data[0].embedding
        
        relevant_chunks = search_similar_chunks(query_embedding, query)        
        if(len(relevant_chunks) == 0):
            return HttpResponse("No relevant example found")
                
        data = [
            {
                "context": c.context,
                "response": c.response,
            }
            for c in relevant_chunks
        ]
        # now what we have to do is we need to give user the example
        # array with object containing {context, response}            
        return JsonResponse({"success":True, "data":data, "type":"database_search"}, safe=False)
    else:
        return JsonResponse("please hit post endpoint", safe=False)

# this is use to upload the csv file to the database
def upload_datasets(req:HttpRequest) -> HttpResponse | JsonResponse:
    # steps, get the csv files, use pandas library to store it in the db
    print(req.method)
    if req.method == "POST" and req.FILES.get('training_dataset'):
        try:
            # let user upload the csv file
            csv_file = req.FILES['training_dataset']
            
            if not csv_file.name.endswith('.csv'):
                return JsonResponse({"error":"dataset must be in the csv format"},status='400')
            
            df = pd.read_csv(csv_file)
            
            for index, row in df.iterrows():
                context = row['Context']
                response = row['Response']
                
                print(f"Context: {context}")
                print(f"Response: {response}")
                
                # # now make the context embeddings
                embedding_response = client.embeddings.create(model="text-embedding-3-small", input=context)                
                embedding = embedding_response.data[0].embedding
                print(embedding)
                
                dataset = CounselingTranscript.objects.create(
                    context = context,
                    response = response,
                    embedding = embedding
                )    
                # and store the context and its embeddings, with its response            
            return JsonResponse({"success":True}, status=200, safe=False)
        
        except Exception as e:
            return JsonResponse(f"Error parsing csv: {str(e)}", status=500,safe=False)
    else:
        return JsonResponse("Invalid Request")

def storeSearches(req:HttpRequest) -> HttpResponse | JsonResponse:
    if req.method == "POST":     
        body_bytes = req.body        
        body_str = body_bytes.decode('utf-8')
        data = json.loads(body_str)
        
        thread_id = data['thread_id']
        message = data['message']
        response = data['response']
        
        print(thread_id, message, response)
        
        ChatMessage.objects.create(
            thread_id=thread_id,
            message=message,
            response = response
        )
        
    return JsonResponse({"success":"added success"},safe=False)