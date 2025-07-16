import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const phrases = [
  "Bonjour, je m'appelle [nom] [prenom]",
];

export const VoiceTest: React.FC = () => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [recording, setRecording] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState('');
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const navigate = useNavigate();

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: BlobPart[] = [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
          toast.error('Aucun audio enregistré. Veuillez réessayer.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', audioBlob, `phrase_${currentPhrase}.${mimeType.split('/')[1]}`);
        formData.append('name', name);
        formData.append('surname', surname);
        formData.append('phrase_number', currentPhrase.toString());

        try {
          const response = await axios.post('http://localhost:8000/api/audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('Réponse du serveur:', response.data);
          toast.success('Enregistrement réussi !');

          // Store voice_id from the first phrase
          if (currentPhrase === 0) {
            setVoiceId(response.data.voice_id);
          }

          if (currentPhrase < phrases.length - 1) {
            setCurrentPhrase(prev => prev + 1);
          } else {
            setSuccess(true);
            toast.success('Toutes les phrases ont été enregistrées avec succès !');
          }
        } catch (error: any) {
          console.error('Erreur lors de l’envoi:', error.response?.data || error.message);
          toast.error(`Échec de l'envoi de l'audio: ${error.response?.data?.detail || error.message}`);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      toast.info('Enregistrement en cours...');

      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setRecording(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Erreur d’accès au microphone:', error);
      toast.error('Erreur d’accès au microphone');
    }
  };

  const testRecognition = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunks = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
          toast.error('Aucun audio enregistré pour la vérification.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const formData = new FormData();
        formData.append('test_audio', audioBlob, `verify.${mimeType.split('/')[1]}`);

        try {
          const response = await axios.post('http://localhost:8000/api/verify-audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('Réponse de vérification:', response.data);
          setRecognitionResult(response.data.message);
          if (response.data.success) {
            toast.success('Reconnaissance réussie ! Bienvenue');
            // Navigate to voicelist with user data
            navigate('/voicelist', {
              state: {
                name: response.data.name,
                surname: response.data.surname,
                voice_id: response.data.voice_id
              }
            });
          } else {
            toast.error('Échec de la reconnaissance. Veuillez réessayer.');
          }
        } catch (error: any) {
          console.error('Erreur de vérification:', error.response?.data || error.message);
          toast.error(`Erreur lors de la vérification vocale: ${error.response?.data?.detail || error.message}`);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      toast.info('Test de reconnaissance en cours...');
      setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);
    } catch (error) {
      console.error('Erreur d’accès au microphone:', error);
      toast.error('Erreur d’accès au microphone');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Enregistrement vocal
      </h1>

      <div className="space-y-4 mb-8">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom
          </label>
          <input
            id="name"
            type="text"
            placeholder="Votre nom"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom
          </label>
          <input
            id="surname"
            type="text"
            placeholder="Votre prénom"
            value={surname}
            onChange={e => setSurname(e.target.value)}
            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {!success && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Phrase {currentPhrase + 1} sur {phrases.length}</h2>
            <p className="text-lg text-blue-600 italic bg-blue-50 p-4 rounded">
              {phrases[currentPhrase]}
            </p>
          </div>
          <button
            onClick={startRecording}
            disabled={recording || !name || !surname}
            className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors
              ${recording || !name || !surname ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {recording ? "Enregistrement en cours..." : "Enregistrer"}
          </button>
          {(!name || !surname) && (
            <p className="mt-2 text-sm text-red-500">
              Veuillez remplir votre nom et prénom avant d'enregistrer
            </p>
          )}
        </div>
      )}

      {success && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Test de reconnaissance</h2>
          <p className="text-gray-600 mb-6">
            Dites une phrase quelconque pour vérifier votre identité vocale.
          </p>
          <button
            onClick={testRecognition}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            Lancer le test de reconnaissance
          </button>
          {recognitionResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-center text-gray-800 font-medium">
                {recognitionResult}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceTest;