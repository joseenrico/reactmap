import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet-routing-machine';
import L from 'leaflet';
import axios from 'axios';
import "leaflet/dist/leaflet.css";


function App() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [route, setRoute] = useState(null);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [isLoading, setisLoading] = useState(false);
  const mapRef = useRef(null);

  const [awal, setawal] = useState(true);

  const handleMap = (data) => {
    setisLoading(true);
    const { alamatAsal, alamatTujuan } = data;

    // Lakukan geocoding untuk mendapatkan koordinat dari alamat
    const geocode = async (address) => {
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const results = response.data;
        if (results && results.length > 0) {
          return [results[0].lat, results[0].lon];
        } else {
          alert(`Tidak dapat menemukan lokasi untuk alamat: ${address}`);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching geocode for ${address}:`, error);
        return null;
      } finally {
        setisLoading(false);
      }
    };

    const getRoute = async () => {
      const startCoords = await geocode(alamatAsal);
      const endCoords = await geocode(alamatTujuan);
      if (startCoords && endCoords && mapRef.current) {
        const mapInstance = mapRef.current;
        const routeControl = L.Routing.control({
          waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(endCoords[0], endCoords[1])
          ],
          createMarker: () => null, // Optional: Remove default markers if you want to customize them
          lineOptions: {
            styles: [{ color: '#6FA1EC', weight: 4 }]
          },
          routeWhileDragging: true,
        }).addTo(mapInstance);

        routeControl.on('routesfound', function (e) {
          const route = e.routes[0];
          setDistance(route.summary.totalDistance / 1000); // Convert to kilometers
          setRoute(route.coordinates);

          const averageSpeedKmPerHour = 50; // Kecepatan rata-rata dalam km/jam
          const estimatedTimeInHours = route.summary.totalDistance / 1000 / averageSpeedKmPerHour;
          const estimatedTimeInMinutes = estimatedTimeInHours * 60;


          setEstimatedTime(estimatedTimeInMinutes);
        });
      }
    };

    getRoute();
  };
  const onSubmit = data => {
    //console.log(data);
    setawal(false);
    handleMap(data)
  };

  return (
    <>
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-lg shadow-lg">
          {/* Kolom Kiri: Form */}
          <div>
            <h2 className="text-2xl font-bold mb-5">Pesan DuniaCoding-Jek</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamatAsal">
                  Alamat Asal
                </label>
                <textarea
                  id="alamatAsal"
                  type="text"
                  className={`shadow appearance-none h-32 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.alamatAsal ? 'border-red-500' : ''}`}
                  {...register("alamatAsal", { required: "Alamat Asal harus diisi" })}
                />
                {errors.alamatAsal && <p className="text-red-500 text-xs italic">{errors.alamatAsal.message}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alamatTujuan">
                  Alamat Tujuan
                </label>
                <textarea
                  id="alamatTujuan"
                  type="text"
                  className={`shadow appearance-none h-32 border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.alamatTujuan ? 'border-red-500' : ''}`}
                  {...register("alamatTujuan", { required: "Alamat Tujuan harus diisi" })}
                />
                {errors.alamatTujuan && <p className="text-red-500 text-xs italic">{errors.alamatTujuan.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  Kirim
                </button>
                {!awal && <div id='keterangan' className="ml-10">
                  {distance && estimatedTime && (
                    <p className="mt-5 text-gray-700">
                      Jarak: {distance.toFixed(2)} km <br />
                      Estimasi Waktu Sampai: {Math.ceil(estimatedTime)} menit <br />
                      Harga: Rp. {(Math.ceil(distance.toFixed(2) * 100000)).toLocaleString('id-ID')},- *<br />
                      <small>*dibawah 1 KM = Rp. 12.000</small>
                    </p>
                  )}


                </div>}
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Gambar */}
          <div className="flex items-center justify-center">

            <br />

            {awal ? <><p className="text-red-500 text-2xl font-bold mb-5">Silahkan Isi Alamat Terlebih Dahulu</p></> : <>
              {isLoading ? <><div className="flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
              </div></> : <>

                <MapContainer center={[-6.200000, 106.816666]} zoom={13} className="h-96 w-full" ref={mapRef}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {route && (
                    <>
                      <Marker position={route[0]} />
                      <Marker position={route[route.length - 1]} />
                      <Polyline positions={route} color="blue" />
                    </>
                  )}
                </MapContainer>


              </>}
            </>}
          </div>

        </div>
      </div>
    </>
  )
}

export default App
