import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useApp } from '../../context/AppContext';
import { MapPin, Navigation, Car, Bus, Train, Plane, PlusCircle, AlertCircle } from 'lucide-react';
import { EMISSION_FACTORS } from '../../data/constants';

const TRANSPORT_MODES = [
  { id: 'car', label: 'Car', icon: Car, factor: EMISSION_FACTORS.car, emoji: '🚗' },
  { id: 'publicTransit', label: 'Bus', icon: Bus, factor: EMISSION_FACTORS.publicTransit, emoji: '🚌' },
  { id: 'train', label: 'Train', icon: Train, factor: 0.041, emoji: '🚂' }, // Typical train factor
  { id: 'flight', label: 'Flight', icon: Plane, factor: EMISSION_FACTORS.flight, emoji: '✈️' },
];

export default function TripPlanner() {
  const { addLog, googleMapsKey } = useApp();
  
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState('car');
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const originAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);

  // Load Google Maps API
  useEffect(() => {
    const key = googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) {
      Promise.resolve().then(() => setError('Please add your Google Maps API Key in Settings to use the Trip Planner.'));
      return;
    }

    const loader = new Loader({
      apiKey: key,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      setIsMapLoaded(true);
      setError(null);
    }).catch((e) => {
      console.error('Google Maps Load Error:', e);
      setError('Failed to load Google Maps. Check your API key.');
    });
  }, [googleMapsKey]);

  // Initialize Autocomplete
  useEffect(() => {
    if (!isMapLoaded || !window.google) return;

    if (originInputRef.current && !originAutocompleteRef.current) {
      originAutocompleteRef.current = new window.google.maps.places.Autocomplete(originInputRef.current, {
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      });
      originAutocompleteRef.current.addListener('place_changed', () => {
        const place = originAutocompleteRef.current.getPlace();
        if (place.place_id) {
          setOrigin(place);
          setDistanceKm(null); // Reset distance when origin changes
        }
      });
    }

    if (destinationInputRef.current && !destinationAutocompleteRef.current) {
      destinationAutocompleteRef.current = new window.google.maps.places.Autocomplete(destinationInputRef.current, {
        fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      });
      destinationAutocompleteRef.current.addListener('place_changed', () => {
        const place = destinationAutocompleteRef.current.getPlace();
        if (place.place_id) {
          setDestination(place);
          setDistanceKm(null); // Reset distance when destination changes
        }
      });
    }
  }, [isMapLoaded]);

  const calculateDistance = async () => {
    if (!origin || !destination) {
      setError('Please select both an origin and destination from the dropdown.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const service = new window.google.maps.DistanceMatrixService();
      const response = await service.getDistanceMatrix({
        origins: [{'placeId': origin.place_id}],
        destinations: [{'placeId': destination.place_id}],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      });

      if (response.rows[0].elements[0].status === 'OK') {
        const distanceInMeters = response.rows[0].elements[0].distance.value;
        setDistanceKm(distanceInMeters / 1000);
      } else {
        setError('Could not calculate distance between these locations.');
      }
    } catch (err) {
      console.error('Distance Matrix Error:', err);
      setError('Error calculating distance.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = () => {
    if (!distanceKm) return;
    
    const mode = TRANSPORT_MODES.find(m => m.id === selectedMode);
    const co2 = distanceKm * mode.factor;
    
    // Shorten the address for the label
    const oName = origin.name || origin.formatted_address.split(',')[0];
    const dName = destination.name || destination.formatted_address.split(',')[0];
    
    addLog({
      type: selectedMode,
      category: 'transport',
      co2: co2,
      label: `${oName} to ${dName}`,
      icon: mode.icon.render ? mode.icon.render().props.name : mode.emoji, // Fallback if icon component can't be easily stringified. We use emoji in MainApp anyway.
      color: '#F4A261',
    });
    
    // Reset form
    if (originInputRef.current) originInputRef.current.value = '';
    if (destinationInputRef.current) destinationInputRef.current.value = '';
    setOrigin(null);
    setDestination(null);
    setDistanceKm(null);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="text-[#52B788]" size={20} />
        <h3 className="font-semibold text-offwhite text-sm">Plan a Trip</h3>
      </div>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[rgba(230,57,70,0.1)] border border-[rgba(230,57,70,0.3)] flex items-start gap-2">
          <AlertCircle size={15} className="text-[#E63946] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#E63946]">{error}</p>
        </div>
      )}

      <div className="space-y-3 relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-[#52B788]"></div>
          <input 
            ref={originInputRef}
            type="text" 
            placeholder="Origin (e.g. Home, Airport)" 
            className="form-input pl-8 w-full"
            disabled={!isMapLoaded}
            onChange={(e) => { if (!e.target.value) setOrigin(null); }}
          />
        </div>
        
        <div className="absolute left-3.5 top-8 bottom-8 w-px bg-[rgba(248,249,250,0.1)] z-0"></div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F4A261]"></div>
          <input 
            ref={destinationInputRef}
            type="text" 
            placeholder="Destination (e.g. Office, City)" 
            className="form-input pl-8 w-full"
            disabled={!isMapLoaded}
            onChange={(e) => { if (!e.target.value) setDestination(null); }}
          />
        </div>
      </div>

      <button 
        onClick={calculateDistance}
        disabled={!origin || !destination || loading || !isMapLoaded}
        className="btn-secondary w-full mt-4 flex items-center justify-center gap-2"
      >
        {loading ? <span className="animate-pulse">Calculating...</span> : <><Navigation size={16} /> Calculate Distance</>}
      </button>

      {distanceKm !== null && (
        <div className="mt-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[rgba(248,249,250,0.1)]">
            <span className="text-sm text-[rgba(248,249,250,0.6)]">Distance</span>
            <span className="font-bold text-offwhite">{distanceKm.toFixed(1)} km</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {TRANSPORT_MODES.map(mode => {
              const co2 = distanceKm * mode.factor;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMode === mode.id 
                      ? 'border-[#52B788] bg-[rgba(82,183,136,0.15)]' 
                      : 'border-[rgba(248,249,250,0.1)] hover:border-[rgba(248,249,250,0.2)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <mode.icon size={16} className={selectedMode === mode.id ? 'text-[#52B788]' : 'text-[rgba(248,249,250,0.5)]'} />
                      <span className="text-xs font-medium text-[rgba(248,249,250,0.8)]">{mode.label}</span>
                    </div>
                  </div>
                  <div className="font-bold text-offwhite text-lg">
                    {co2.toFixed(1)} <span className="text-xs text-[rgba(248,249,250,0.4)] font-normal">kg CO₂</span>
                  </div>
                </button>
              )
            })}
          </div>

          <button 
            onClick={handleAddLog}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <PlusCircle size={16} /> Add to Log
          </button>
        </div>
      )}
    </div>
  );
}
