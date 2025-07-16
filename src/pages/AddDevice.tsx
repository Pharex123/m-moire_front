import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

interface ScannedDevice {
  macAddress: string;
  rssi: number;
  lastSeen: string;
}

interface Device {
  id: string;
  name: string;
  type: 'lamp' | 'fan' | 'alarm';
  macAddress: string;
  isOn?: boolean;
  temperature?: number;
  fanOn?: boolean;
  heaterOn?: boolean;
  alarmTime?: string;
}

const generateRandomMac = () => {
  const hexDigits = "0123456789ABCDEF";
  let mac = "";
  for (let i = 0; i < 6; i++) {
    let octet = "";
    for (let j = 0; j < 2; j++) {
      octet += hexDigits[Math.floor(Math.random() * 16)];
    }
    mac += (i === 0 ? "" : ":") + octet;
  }
  return mac;
};

const generateRandomRSSI = () => {
  return Math.floor(Math.random() * ((-40) - (-90)) + (-90));
};

const AddDevice: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'lamp',
    macAddress: ''
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isSimulation, setIsSimulation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: number;
    
    if (isScanning && isSimulation) {
      const initialDevices = Array.from({ length: Math.floor(Math.random() * 2) + 2 }, () => ({
        macAddress: generateRandomMac(),
        rssi: generateRandomRSSI(),
        lastSeen: new Date().toISOString()
      }));
      setScannedDevices(initialDevices);

      interval = window.setInterval(() => {
        setScannedDevices(prev => {
          const updated = prev.map(device => ({
            ...device,
            rssi: generateRandomRSSI(),
            lastSeen: new Date().toISOString()
          }));

          if (Math.random() < 0.2 && updated.length < 5) {
            return [...updated, {
              macAddress: generateRandomMac(),
              rssi: generateRandomRSSI(),
              lastSeen: new Date().toISOString()
            }];
          }

          return updated;
        });
      }, 2000);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isScanning, isSimulation]);

  const startScan = async () => {
    setIsScanning(true);
    if (!isSimulation) {
      try {
        await axios.post('http://localhost:8000/api/scan-devices');
        toast.success('Scan démarré');
      } catch (error) {
        toast.error('Erreur lors du démarrage du scan');
        setIsScanning(false);
      }
    } else {
      toast.info('Mode simulation: Scan démarré');
    }
  };

  const stopScan = async () => {
    setIsScanning(false);
    if (!isSimulation) {
      try {
        await axios.post('http://localhost:8000/api/stop-scan');
        toast.success('Scan arrêté');
      } catch (error) {
        toast.error('Erreur lors de l\'arrêt du scan');
      }
    } else {
      toast.info('Mode simulation: Scan arrêté');
    }
  };

  useEffect(() => {
    if (!isSimulation) {
      const ws = new WebSocket('ws://localhost:8000/ws');

      ws.onmessage = (event) => {
        const device = JSON.parse(event.data);
        setScannedDevices(prev => {
          const exists = prev.find(d => d.macAddress === device.macAddress);
          if (exists) {
            return prev.map(d => 
              d.macAddress === device.macAddress 
                ? { ...d, rssi: device.rssi, lastSeen: device.lastSeen }
                : d
            );
          }
          return [...prev, device];
        });
      };

      return () => {
        ws.close();
      };
    }
  }, [isSimulation]);

  const selectDevice = (macAddress: string) => {
    setSelectedDevice(macAddress);
    setFormData(prev => ({
      ...prev,
      macAddress
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Le nom de l'appareil est requis");
      return false;
    }
    if (!formData.type) {
      setError("Le type d'appareil est requis");
      return false;
    }
    if (!formData.macAddress) {
      setError("Veuillez sélectionner un appareil");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    if (isSimulation) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newDevice: Device = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          type: formData.type as 'lamp' | 'fan' | 'alarm',
          macAddress: formData.macAddress,
          ...(formData.type === 'lamp' && { isOn: false }),
          ...(formData.type === 'fan' && {
            temperature: 22,
            fanOn: false,
            heaterOn: false
          }),
          ...(formData.type === 'alarm' && { alarmTime: undefined })
        };

        localStorage.setItem('isSimulation', 'true');
        const existingDevices: Device[] = JSON.parse(localStorage.getItem('devices') || '[]');
        const updatedDevices = [...existingDevices, newDevice];
        localStorage.setItem('devices', JSON.stringify(updatedDevices));

        toast.success('Mode simulation: Appareil ajouté avec succès');
        navigate('/dashboard');
      } catch (error) {
        toast.error('Erreur lors de la simulation');
        setError('Erreur lors de la sauvegarde des données');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8000/api/pair-device`, {
        macAddress: formData.macAddress,
        type: formData.type,
        name: formData.name
      });

      if (response.data.success) {
        toast.success('Appareil ajouté avec succès');
        navigate('/dashboard');
      } else {
        setError(response.data.message || "Erreur lors de l'ajout de l'appareil");
        toast.error(response.data.message || "Erreur lors de l'ajout de l'appareil");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 
                         "Erreur de connexion au serveur. Vérifiez que le serveur est en cours d'exécution.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Erreur détaillée:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -60) return 'Bon';
    if (rssi >= -70) return 'Moyen';
    return 'Faible';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ajouter un appareil</h1>
      
      <div className="mb-8 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Scanner les appareils</h2>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={isSimulation}
                  onChange={(e) => setIsSimulation(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-600">Mode simulation</span>
              </label>
            </div>
          </div>
          <button
            onClick={isScanning ? stopScan : startScan}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              isScanning 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isScanning ? 'Arrêter le scan' : 'Démarrer le scan'}
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {scannedDevices.map((device) => (
            <div
              key={device.macAddress}
              onClick={() => selectDevice(device.macAddress)}
              className={`p-4 border rounded-md cursor-pointer transition-colors ${
                selectedDevice === device.macAddress
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{device.macAddress}</p>
                  <p className="text-sm text-gray-500">
                    Signal: {getSignalStrength(device.rssi)}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Dernière détection: {new Date(device.lastSeen).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isScanning && scannedDevices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Recherche d'appareils en cours...
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'appareil
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Lampe salon"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type d'appareil
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lamp">Lampe</option>
              <option value="fan">Ventilateur</option>
              <option value="alarm">Alarme</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Appareil sélectionné
            </label>
            {selectedDevice ? (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">{selectedDevice}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Veuillez sélectionner un appareil dans la liste des appareils scannés
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedDevice}
              className={`px-4 py-2 text-white rounded-md transition-colors relative ${
                selectedDevice
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Ajouter</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                'Ajouter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDevice;