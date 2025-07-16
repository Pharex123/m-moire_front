from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union
import uvicorn
from datetime import datetime

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Data models
class BaseDevice(BaseModel):
    id: str
    name: str
    type: str
    macAddress: str

class LampDevice(BaseDevice):
    type: str = "lamp"
    isOn: bool = False

class FanDevice(BaseDevice):
    type: str = "fan"
    temperature: float = 22.0
    fanOn: bool = False
    heaterOn: bool = False

class AlarmDevice(BaseDevice):
    type: str = "alarm"
    alarmTime: Optional[str] = None

Device = Union[LampDevice, FanDevice, AlarmDevice]

# In-memory storage
devices: List[Device] = []

@app.get("/api/devices")
async def get_devices():
    return devices

@app.post("/api/devices/{device_id}/action")
async def device_action(device_id: str, action: dict):
    device = next((d for d in devices if d.id == device_id), None)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    action_type = action.get("action")
    if not action_type:
        raise HTTPException(status_code=400, detail="Action not specified")

    if device.type == "lamp":
        if action_type == "turn_on":
            device.isOn = True
        elif action_type == "turn_off":
            device.isOn = False
    elif device.type == "fan":
        if action_type == "fan_on":
            device.fanOn = True
        elif action_type == "fan_off":
            device.fanOn = False
        elif action_type == "heater_on":
            device.heaterOn = True
        elif action_type == "heater_off":
            device.heaterOn = False
    elif device.type == "alarm":
        if action_type == "set_alarm":
            device.alarmTime = action.get("time")

    return {"success": True}

# Add some sample devices for testing
sample_devices = [
    LampDevice(id="1", name="Lampe du salon", macAddress="00:11:22:33:44:55"),
    FanDevice(id="2", name="Ventilateur de la chambre", macAddress="AA:BB:CC:DD:EE:FF"),
    AlarmDevice(id="3", name="Alarme de la cuisine", macAddress="11:22:33:44:55:66")
]
devices.extend(sample_devices)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 