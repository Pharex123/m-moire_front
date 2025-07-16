import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

interface Voice {
  id: string;
  name: string;
  surname: string;
  created_at: string;
}

const VoiceList: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchVoices = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/audio');
      let newVoices = response.data;

      // Add newly verified user from location.state if present
      if (location.state) {
        const { name, surname, voice_id } = location.state;
        const existingVoice = newVoices.find((voice: Voice) => voice.id === voice_id);
        if (!existingVoice) {
          newVoices = [
            ...newVoices,
            {
              id: voice_id,
              name,
              surname,
              created_at: new Date().toISOString()
            }
          ];
        }
      }

      setVoices(newVoices);
      setLoading(false);
    } catch (error) {
      toast.error('Erreur lors du chargement des voix');
      setLoading(false);
      console.error('Erreur:', error);
    }
  };

  const deleteVoice = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await axios.delete(`http://localhost:8000/api/audio/${id}`);
        toast.success('Utilisateur supprimé avec succès');
        setVoices(voices.filter(voice => voice.id !== id));
      } catch (error) {
        toast.error('Erreur lors de la suppression');
        console.error('Erreur:', error);
      }
    }
  };

  useEffect(() => {
    fetchVoices();
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Liste des utilisateurs vérifiés
      </h1>

      {voices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Aucun utilisateur vérifié</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {voices.map(voice => (
            <div
              key={voice.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {voice.name} {voice.surname}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Vérifié le {new Date(voice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteVoice(voice.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceList;