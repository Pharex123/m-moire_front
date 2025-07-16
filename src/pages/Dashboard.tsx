import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import throttle from 'lodash.throttle';

// Types pour les différents appareils
interface BaseDevice {
  id: string;
  name: string;
  type: 'lamp' | 'fan' | 'alarm';
  macAddress: string;
}

interface LampDevice extends BaseDevice {
  type: 'lamp';
  isOn: boolean;
}

interface FanDevice extends BaseDevice {
  type: 'fan';
  temperature: number;
  fanOn: boolean;
  heaterOn: boolean;
}

interface AlarmDevice extends BaseDevice {
  type: 'alarm';
  alarmTime?: string;
}

type Device = LampDevice | FanDevice | AlarmDevice;

// Fonction de traduction des noms d'appareils
const translateDeviceName = (name: string, type: string): string => {
  const translations: { [key: string]: { [key: string]: string } } = {
    'lamp': {
      'Living Room Lamp': 'Lampe du salon',
      'Bedroom Lamp': 'Lampe de la chambre',
      'Kitchen Lamp': 'Lampe de la cuisine',
      'Bathroom Lamp': 'Lampe de la salle de bain',
      'Office Lamp': 'Lampe du bureau',
      'Garden Lamp': 'Lampe du jardin',
      'Porch Lamp': 'Lampe du porche',
      'Hallway Lamp': 'Lampe du couloir'
    },
    'fan': {
      'Living Room Fan': 'Ventilateur du salon',
      'Bedroom Fan': 'Ventilateur de la chambre',
      'Kitchen Fan': 'Ventilateur de la cuisine',
      'Bathroom Fan': 'Ventilateur de la salle de bain',
      'Office Fan': 'Ventilateur du bureau',
      'Garden Fan': 'Ventilateur du jardin',
      'Porch Fan': 'Ventilateur du porche',
      'Hallway Fan': 'Ventilateur du couloir'
    },
    'alarm': {
      'Living Room Alarm': 'Alarme du salon',
      'Bedroom Alarm': 'Alarme de la chambre',
      'Kitchen Alarm': 'Alarme de la cuisine',
      'Bathroom Alarm': 'Alarme de la salle de bain',
      'Office Alarm': 'Alarme du bureau',
      'Garden Alarm': 'Alarme du jardin',
      'Porch Alarm': 'Alarme du porche',
      'Hallway Alarm': 'Alarme du couloir'
    }
  };

  // Vérifier si une traduction existe pour ce nom et ce type
  if (translations[type] && translations[type][name]) {
    return translations[type][name];
  }

  // Si pas de traduction exacte, essayer de traduire les mots communs
  let translatedName = name;
  
  // Traductions de mots communs
  const commonTranslations: { [key: string]: string } = {
    'Living Room': 'Salon',
    'Bedroom': 'Chambre',
    'Kitchen': 'Cuisine',
    'Bathroom': 'Salle de bain',
    'Office': 'Bureau',
    'Garden': 'Jardin',
    'Porch': 'Porche',
    'Hallway': 'Couloir',
    'Lamp': 'Lampe',
    'Fan': 'Ventilateur',
    'Alarm': 'Alarme',
    'Room': 'Pièce',
    'Light': 'Lumière',
    'Heater': 'Chauffage',
    'Thermostat': 'Thermostat'
  };

  // Appliquer les traductions de mots communs
  Object.keys(commonTranslations).forEach(english => {
    const french = commonTranslations[english];
    translatedName = translatedName.replace(new RegExp(english, 'gi'), french);
  });

  return translatedName;
};

// Composants pour chaque type d'appareil
const LampCard: React.FC<{ device: LampDevice; onToggle: (id: string) => void }> = ({ device, onToggle }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{translateDeviceName(device.name, device.type)}</h3>
      <span className="text-sm text-gray-500">MAC: {device.macAddress}</span>
    </div>
    
    {/* Animation de la lampe */}
    <div className="flex justify-center mb-6">
      <div className="relative">
        {/* Rayons de lumière multiples */}
        {device.isOn && (
          <>
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-200 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-yellow-300 via-orange-300 to-red-200 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-orange-200 via-red-200 to-pink-200 animate-spin" style={{ animationDuration: '10s' }} />
          </>
        )}
        
        {/* Cercle de lueur principal */}
        <div 
          className={`absolute inset-0 rounded-full transition-all duration-700 ease-out ${
            device.isOn 
              ? 'bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-200 shadow-2xl shadow-yellow-400/60 scale-125' 
              : 'bg-gray-200 scale-100'
          }`}
          style={{
            filter: device.isOn ? 'blur(12px)' : 'blur(0px)',
            transform: device.isOn ? 'scale(1.25)' : 'scale(1)'
          }}
        />
        
        {/* Effet de brillance */}
        {device.isOn && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
        )}
        
        {/* Conteneur de l'ampoule */}
        <div className={`relative z-20 p-6 rounded-full transition-all duration-700 ease-out ${
          device.isOn 
            ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-300 text-yellow-900 shadow-2xl shadow-yellow-500/50 scale-110' 
            : 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-600 shadow-lg'
        }`}>
          
          {/* Ampoule avec effet de verre */}
          <div className={`relative w-12 h-12 transition-all duration-700 ${
            device.isOn ? 'animate-bounce' : ''
          }`} style={{ animationDuration: device.isOn ? '2s' : '0s' }}>
            
            {/* Corps de l'ampoule */}
            <svg 
              className="w-full h-full drop-shadow-lg"
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
            </svg>
            
            {/* Filament lumineux */}
            {device.isOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '1s' }} />
                <div className="absolute w-2 h-2 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                <div className="absolute w-3 h-3 bg-orange-200 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
              </div>
            )}
            
            {/* Reflets sur l'ampoule */}
            {device.isOn && (
              <div className="absolute top-1 left-2 w-2 h-2 bg-white/60 rounded-full blur-sm" />
            )}
          </div>
        </div>
        
        {/* Particules de lumière */}
        {device.isOn && (
          <>
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-orange-300 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <div className="absolute -bottom-2 -right-2 w-1 h-1 bg-orange-200 rounded-full animate-ping" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }} />
          </>
        )}
        
        {/* Onde de choc lumineuse */}
        {device.isOn && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-300/50 animate-ping" style={{ animationDuration: '4s' }} />
        )}
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <span className={`text-sm ${device.isOn ? 'text-green-500' : 'text-gray-500'}`}>
        {device.isOn ? 'Allumée' : 'Éteinte'}
      </span>
      <button
        onClick={() => onToggle(device.id)}
        className={`px-4 py-2 rounded-md transition-colors ${
          device.isOn
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {device.isOn ? 'Éteindre/cì' : 'Allumer/Tà'}
      </button>
    </div>
  </div>
);

const FanCard: React.FC<{
  device: FanDevice;
  onToggleFan: (id: string) => void;
  onToggleHeater: (id: string) => void;
}> = ({ device, onToggleFan, onToggleHeater }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{translateDeviceName(device.name, device.type)}</h3>
      <span className="text-sm text-gray-500">MAC: {device.macAddress}</span>
    </div>
    
    <div className="mb-4">
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`${device.temperature > 25 ? '#ef4444' : '#3b82f6'}`}
            strokeWidth="10"
            strokeDasharray={`${(device.temperature / 50) * 283} 283`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{device.temperature}°C</span>
        </div>
      </div>
    </div>
    
    {/* Animation du ventilateur et du chauffage */}
    <div className="flex justify-center mb-4">
      <div className="relative">
        {/* Cercle de base du ventilateur */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 shadow-lg flex items-center justify-center">
          
          {/* Hélices du ventilateur */}
          <div className={`relative w-20 h-20 transition-all duration-500 ${
            device.fanOn ? 'animate-spin' : ''
          }`} style={{ animationDuration: device.fanOn ? '0.5s' : '0s' }}>
            
            {/* Hélice 1 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-gray-700 rounded-full" />
            
            {/* Hélice 2 */}
            <div className="absolute top-1/2 right-0 transform translate-y-1/2 w-8 h-2 bg-gray-700 rounded-full" />
            
            {/* Hélice 3 */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-gray-700 rounded-full" />
            
            {/* Hélice 4 */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-8 h-2 bg-gray-700 rounded-full" />
            
            {/* Centre du ventilateur */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-800 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Effet de vent quand le ventilateur tourne */}
        {device.fanOn && (
          <>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-blue-200 rounded-full animate-pulse" style={{ animationDuration: '0.3s' }} />
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDuration: '0.4s', animationDelay: '0.1s' }} />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDuration: '0.5s', animationDelay: '0.2s' }} />
          </>
        )}
      </div>
      
      {/* Animation du chauffage */}
      <div className="relative ml-8">
        <div className={`w-16 h-16 rounded-full transition-all duration-500 ${
          device.heaterOn 
            ? 'bg-gradient-to-br from-red-400 via-red-500 to-orange-500 shadow-lg shadow-red-500/50' 
            : 'bg-gradient-to-br from-gray-300 to-gray-400'
        }`}>
          
          {/* Éléments chauffants */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-8 h-8 transition-all duration-500 ${
              device.heaterOn ? 'animate-pulse' : ''
            }`} style={{ animationDuration: device.heaterOn ? '1s' : '0s' }}>
              
              {/* Symbole de chaleur */}
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          
          {/* Ondes de chaleur */}
          {device.heaterOn && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-red-400/60 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full border-2 border-orange-400/40 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400/30 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            </>
          )}
        </div>
        
        {/* Particules de chaleur */}
        {device.heaterOn && (
          <>
            <div className="absolute -top-1 -left-1 w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute -top-1 -right-1 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.6s' }} />
            <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-red-300 rounded-full animate-ping" style={{ animationDuration: '2.2s', animationDelay: '0.9s' }} />
          </>
        )}
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <span className="block text-sm text-gray-500 mb-2">Ventilateur</span>
        <button
          onClick={() => onToggleFan(device.id)}
          className={`w-full px-4 py-2 rounded-md transition-colors ${
            device.fanOn
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {device.fanOn ? 'Arrêter/cì' : 'Démarrer/Tà'}
        </button>
      </div>
      <div>
        <span className="block text-sm text-gray-500 mb-2">Chauffage</span>
        <button
          onClick={() => onToggleHeater(device.id)}
          className={`w-full px-4 py-2 rounded-md transition-colors ${
            device.heaterOn
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {device.heaterOn ? 'Arrêter/cì' : 'Démarrer/Tà'}
        </button>
      </div>
    </div>
  </div>
);

const AlarmCard: React.FC<{ device: AlarmDevice; onSetAlarm: (id: string, time: string) => void }> = ({
  device,
  onSetAlarm,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(device.alarmTime || '');

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{translateDeviceName(device.name, device.type)}</h3>
        <span className="text-sm text-gray-500">MAC: {device.macAddress}</span>
      </div>
      
      {/* Animation de l'alarme */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          {/* Cercle de base de l'alarme */}
          <div className={`w-24 h-24 rounded-full transition-all duration-500 ${
            device.alarmTime 
              ? 'bg-gradient-to-br from-red-400 via-red-500 to-pink-500 shadow-lg shadow-red-500/50' 
              : 'bg-gradient-to-br from-gray-300 to-gray-400'
          }`}>
            
            {/* Icône d'alarme */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-12 h-12 transition-all duration-500 ${
                device.alarmTime ? 'animate-bounce' : ''
              }`} style={{ animationDuration: device.alarmTime ? '1s' : '0s' }}>
                
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                
                {/* Clochette intérieure */}
                {device.alarmTime && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '0.8s' }} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Ondes sonores */}
            {device.alarmTime && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-red-400/60 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-pink-400/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-orange-400/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
              </>
            )}
          </div>
          
          {/* Particules d'alerte */}
          {device.alarmTime && (
            <>
              <div className="absolute -top-2 -left-2 w-2 h-2 bg-red-400 rounded-full animate-ping" style={{ animationDuration: '1s' }} />
              <div className="absolute -top-2 -right-2 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
              <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{ animationDuration: '1.4s', animationDelay: '0.4s' }} />
              <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-red-300 rounded-full animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.6s' }} />
              
              {/* Particules supplémentaires */}
              <div className="absolute top-1/2 -left-3 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '0.8s', animationDelay: '0.1s' }} />
              <div className="absolute top-1/2 -right-3 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '0.9s', animationDelay: '0.3s' }} />
              <div className="absolute -top-3 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '1.1s', animationDelay: '0.5s' }} />
              <div className="absolute -bottom-3 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDuration: '1.3s', animationDelay: '0.7s' }} />
            </>
          )}
          
          {/* Effet de vibration */}
          {device.alarmTime && (
            <div className="absolute inset-0 rounded-full bg-red-200/20 animate-pulse" style={{ animationDuration: '0.5s' }} />
          )}
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={() => setShowTimePicker(!showTimePicker)}
          className="p-4 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
        >
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {device.alarmTime && (
          <p className="mt-2 text-sm text-gray-600">
            Alarme programmée pour : {device.alarmTime}
          </p>
        )}
        {showTimePicker && (
          <div className="mt-4">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="mb-2 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => {
                onSetAlarm(device.id, selectedTime);
                setShowTimePicker(false);
              }}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Définir
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulation] = useState(() => {
    return localStorage.getItem('isSimulation') === 'true';
  });
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Throttle state updates
  const updateDeviceState = throttle((updatedDevice: Device) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.id === updatedDevice.id ? { ...device, ...updatedDevice } : device
      )
    );
  }, 1000);

  const removeDevice = (deviceId: string) => {
    setDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
  };

  const establishWebSocketConnection = () => {
    if (!isSimulation) {
      const ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onopen = () => {
        console.log('WebSocket connexion établie');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'initial_state') {
            setDevices(data.devices);
          } else if (data.type === 'device_update') {
            updateDeviceState(data.device);
          } else if (data.type === 'device_deleted') {
            removeDevice(data.device_id);
          }
        } catch (error) {
          console.error('Erreur lors du traitement du message WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        toast.error('Erreur de connexion avec le serveur');
      };

      ws.onclose = () => {
        console.log('WebSocket connexion fermée');
        setTimeout(establishWebSocketConnection, 5000);
      };

      setWsConnection(ws);
    }
  };

  const sendActionToBackend = async (deviceId: string, action: string, payload: any = {}) => {
    if (isSimulation) {
      return simulateAction(deviceId, action, payload);
    }

    try {
      await axios.post(`http://localhost:8000/api/devices/${deviceId}/action`, {
        action,
        ...payload
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'action:', error);
      toast.error('Erreur lors de l\'envoi de l\'action au serveur');
      throw error;
    }
  };

  const simulateAction = (deviceId: string, action: string, payload: any = {}) => {
    const updatedDevices = devices.map((device) => {
      if (device.id === deviceId) {
        switch (action) {
          case 'turn_on':
          case 'turn_off':
            if (device.type === 'lamp') {
              return { ...device, isOn: action === 'turn_on' };
            }
            break;
          case 'fan_on':
          case 'fan_off':
            if (device.type === 'fan') {
              return { ...device, fanOn: action === 'fan_on' };
            }
            break;
          case 'heater_on':
          case 'heater_off':
            if (device.type === 'fan') {
              return { ...device, heaterOn: action === 'heater_on' };
            }
            break;
          case 'set_alarm':
            if (device.type === 'alarm') {
              return { ...device, alarmTime: payload.time };
            }
            break;
        }
      }
      return device;
    });

    localStorage.setItem('devices', JSON.stringify(updatedDevices));
    setDevices(updatedDevices);
  };

  useEffect(() => {
    fetchDevices();
    if (!isSimulation) {
      establishWebSocketConnection();
    }

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const fetchDevices = async () => {
    try {
      if (isSimulation) {
        const storedDevices = localStorage.getItem('devices');
        setDevices(storedDevices ? JSON.parse(storedDevices) : []);
        
      } else {
        const response = await axios.get('http://localhost:8000/api/devices');
        setDevices(response.data);
        
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des appareils');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLamp = async (id: string, currentState: boolean) => {
    try {
      await sendActionToBackend(id, currentState ? 'turn_off' : 'turn_on');
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'état de la lampe');
    }
  };

  const handleToggleFan = async (id: string, currentState: boolean) => {
    try {
      await sendActionToBackend(id, currentState ? 'fan_off' : 'fan_on');
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'état du ventilateur');
    }
  };

  const handleToggleHeater = async (id: string, currentState: boolean) => {
    try {
      await sendActionToBackend(id, currentState ? 'heater_off' : 'heater_on');
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'état du chauffage');
    }
  };

  const handleSetAlarm = async (id: string, time: string) => {
    try {
      await sendActionToBackend(id, 'set_alarm', { time });
    } catch (error) {
      toast.error('Erreur lors de la modification de l\'alarme');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            isSimulation ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            Mode {isSimulation ? 'simulation' : 'réel'}
          </span>
          <Link
            to="/add-devices"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ajouter un appareil
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => {
          switch (device.type) {
            case 'lamp':
              return <LampCard key={device.id} device={device as LampDevice} onToggle={() => handleToggleLamp(device.id, device.isOn)} />;
            case 'fan':
              return (
                <FanCard
                  key={device.id}
                  device={device as FanDevice}
                  onToggleFan={() => handleToggleFan(device.id, device.fanOn)}
                  onToggleHeater={() => handleToggleHeater(device.id, device.heaterOn)}
                />
              );
            case 'alarm':
              return (
                <AlarmCard
                  key={device.id}
                  device={device as AlarmDevice}
                  onSetAlarm={handleSetAlarm}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default Dashboard;