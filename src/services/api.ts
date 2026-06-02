import axios from "axios";

const api = axios.create({
  // tenemos que reemplazar con IP local de la PC donde corremos
  baseURL: "http://192.168.0.183:8000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default api;
