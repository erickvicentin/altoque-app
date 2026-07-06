import axios from "axios";

const localhost = "http://192.168.0.120:8000";

const api = axios.create({
  // tenemos que reemplazar con IP local de la PC donde corremos
  // podemos obtenerla con ipconfig getifaddr en0 (Mac) o ipconfig getifaddr en (Windows)
  baseURL: `${localhost}/api`,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;
