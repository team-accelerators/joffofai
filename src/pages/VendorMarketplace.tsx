import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import VendorMap from "../components/VendorMap";
import { ApiService } from "../services/apiService";
import axios from "axios";

// Leaflet imports
import { LatLng } from "leaflet";

// Constants
const DEFAULT_MAX_DISTANCE = 10; // km
const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "ingredients", label: "Fresh Ingredients" },
  { value: "spices", label: "Spices & Seasonings" },
  { value: "equipment", label: "Cooking Equipment" },
  { value: "groceries", label: "Groceries" },
];

// Types
export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo?: string;
  rating: number;
  reviews: number;
  location: string;
  coordinates?: { lat: number; lng: number };
  distance?: number;
  category: "ingredients" | "spices" | "equipment" | "groceries";
  verified: boolean;
  deliveryTime: string;
  minOrder?: number;
  deliveryFee?: number;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  description: string;
  category: string;
  inStock: boolean;
  unit: string;
  discount?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  vendorId: string;
}

interface VendorCardProps {
  vendor: Vendor;
  onAddToCart: (product: Product, vendorId: string) => void;
  onGetDirections?: (vendor: Vendor) => void;
  userLocation?: { lat: number; lng: number } | null;
}

interface AddressDetails {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface LocationFilters {
  radius: number;
  searchAddress?: string;
  autoUpdate: boolean;
}

// Helper functions
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCartTotal = (cart: CartItem[]): number => {
  return cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
};

// VendorCard Component
const VendorCard: React.FC<VendorCardProps> = ({ vendor, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {vendor.name}
              </h3>
              {vendor.verified && (
                <svg
                  className="w-5 h-5 text-blue-500 ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" />
                </svg>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">{vendor.description}</p>
            <div className="flex items-center mt-2 space-x-4">
              {vendor.distance !== undefined && (
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                  </svg>
                  {vendor.distance.toFixed(1)} km away
                </div>
              )}
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm font-medium">
                  {vendor.rating}
                </span>
                <span className="text-gray-500 text-sm ml-1">
                  ({vendor.reviews} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {vendor.products.slice(0, 4).map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-gray-600 text-sm">{product.description}</p>
                  <div className="mt-2">
                    <span className="font-semibold text-primary">
                      ${product.price}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      /{product.unit}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAddToCart(product, vendor.id)}
                  disabled={!product.inStock}
                >
                  {product.inStock ? "Add" : "Out of Stock"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function VendorMarketplace() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [showCart, setShowCart] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [maxDistance, setMaxDistance] = useState(DEFAULT_MAX_DISTANCE);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Additional location states
  const [locationFilters, setLocationFilters] = useState<LocationFilters>({
    radius: DEFAULT_MAX_DISTANCE,
    autoUpdate: true,
  });
  const [searchAddress, setSearchAddress] = useState("");
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [watchLocationId, setWatchLocationId] = useState<number | null>(null);
  const [selectedVendorForDirections, setSelectedVendorForDirections] =
    useState<Vendor | null>(null);
  // Fetch vendors
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = userLocation
        ? {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: locationFilters.radius,
          }
        : {};

      // Prefer ApiService if available, otherwise fallback to axios
      if (ApiService && typeof ApiService.getVendors === "function") {
        const result = await ApiService.getVendors(params);
        let fetchedVendors: Vendor[] = [];
        if (Array.isArray(result)) {
          fetchedVendors = result as Vendor[];
        } else if (result && Array.isArray((result as any).data)) {
          fetchedVendors = (result as any).data as Vendor[];
        } else {
          fetchedVendors = [];
        }

        // If user location exists, calculate distances
        if (userLocation) {
          const vendorsWithDistance = fetchedVendors.map((vendor: Vendor) => {
            if (vendor.coordinates) {
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                vendor.coordinates.lat,
                vendor.coordinates.lng
              );
              return { ...vendor, distance };
            }
            return vendor;
          });
          setVendors(vendorsWithDistance);
        } else {
          setVendors(fetchedVendors);
        }
      } else {
        const response = await axios.get("/vendors", { params });
        const fetchedVendors: Vendor[] = response.data || [];
        if (userLocation) {
          const vendorsWithDistance = fetchedVendors.map((vendor: Vendor) => {
            if (vendor.coordinates) {
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                vendor.coordinates.lat,
                vendor.coordinates.lng
              );
              return { ...vendor, distance };
            }
            return vendor;
          });
          setVendors(vendorsWithDistance);
        } else {
          setVendors(fetchedVendors);
        }
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      showToast("Failed to load vendors", "error");
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchVendors();
    checkLocationPermission();
    return () => {
      // Cleanup location watcher
      if (watchLocationId !== null) {
        navigator.geolocation.clearWatch(watchLocationId);
      }
    };
  }, []);

  // Memoized filtered and sorted vendors
  const filteredVendors = useMemo(() => {
    if (!vendors.length) return [];

    let filtered = [...vendors];

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query)
      );
    }

    // Apply distance filter if user location exists
    if (userLocation) {
      filtered = filtered.filter((v) => {
        if (!v.coordinates || !v.distance) return false;
        return v.distance <= locationFilters.radius;
      });
    }

    // Sort vendors
    filtered.sort((a, b) => {
      if (sortBy === "distance" && a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return b.rating - a.rating;
    });

    return filtered;
  }, [
    vendors,
    selectedCategory,
    searchQuery,
    userLocation,
    locationFilters.radius,
    sortBy,
  ]);

  // Update vendor distances when user location changes
  useEffect(() => {
    if (userLocation && vendors.length > 0) {
      const vendorsWithDistance = vendors.map((v: Vendor) => {
        if (v.coordinates) {
          try {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              v.coordinates.lat,
              v.coordinates.lng
            );
            return { ...v, distance };
          } catch (error) {
            console.error("Error calculating distance:", error);
            return v;
          }
        }
        return v;
      });
      setVendors(vendorsWithDistance);
    }
  }, [userLocation]);

  // Handlers
  const addToCart = (product: Product, vendorId: string) => {
    const existingItem = cart.find(
      (item) => item.product.id === product.id && item.vendorId === vendorId
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id && item.vendorId === vendorId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, vendorId }]);
    }

    showToast("Added to cart", "success");
  };

  const checkLocationPermission = async () => {
    if ("geolocation" in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        setLocationPermission(permission.state as any);

        if (permission.state === "granted") {
          if (locationFilters.autoUpdate) {
            startLocationWatcher();
          } else {
            getCurrentLocation();
          }
        }
      } catch (error) {
        console.log("Location permission check failed:", error);
      }
    }
  };

  const startLocationWatcher = () => {
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          showToast("Location updated", "success");
        },
        (error) => {
          console.error("Error watching location:", error);
          showToast("Failed to update location", "error");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
      setWatchLocationId(id);
    }
  };

  const searchByAddress = async (address: string) => {
    try {
      setIsAddressSearching(true);
      // Using Nominatim OpenStreetMap API for geocoding
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );

      if (response.data && response.data[0]) {
        const { lat, lon } = response.data[0];
        setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        showToast("Location found", "success");
      } else {
        showToast("Address not found", "error");
      }
    } catch (error) {
      console.error("Error searching address:", error);
      showToast("Failed to search address", "error");
    } finally {
      setIsAddressSearching(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          });
        }
      );

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setUserLocation(location);
      showToast("Location detected! Showing nearby vendors", "success");
    } catch (error: any) {
      if (error.code === error.PERMISSION_DENIED) {
        showToast(
          "Location access denied. Enable location for nearby vendors.",
          "warning"
        );
      } else if (error.code === error.TIMEOUT) {
        showToast("Location request timed out. Please try again.", "warning");
      } else {
        showToast("Unable to get your location. Showing all vendors.", "info");
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
            Vendor Marketplace
          </h1>
          <div className="flex items-center space-x-4">
            <Button
              variant={viewMode === "list" ? "primary" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              variant={viewMode === "map" ? "primary" : "outline"}
              onClick={() => setViewMode("map")}
            >
              Map View
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="rating">Sort by Rating</option>
            <option value="distance">Sort by Distance</option>
          </select>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Search vendors..."
              className="form-input flex-grow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input
              type="number"
              placeholder="Radius (km)"
              className="form-input w-24"
              value={locationFilters.radius}
              onChange={(e) =>
                setLocationFilters((prev) => ({
                  ...prev,
                  radius: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
            />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search by address..."
                className="form-input flex-grow"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => searchByAddress(searchAddress)}
                disabled={isAddressSearching || !searchAddress}
              >
                {isAddressSearching ? "..." : "Find"}
              </Button>
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={locationFilters.autoUpdate}
                onChange={(e) => {
                  setLocationFilters((prev) => ({
                    ...prev,
                    autoUpdate: e.target.checked,
                  }));
                  if (e.target.checked) {
                    startLocationWatcher();
                  } else if (watchLocationId !== null) {
                    navigator.geolocation.clearWatch(watchLocationId);
                    setWatchLocationId(null);
                  }
                }}
              />
              <span>Auto-update location</span>
            </label>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewMode === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="h-[600px] rounded-lg overflow-hidden">
            <VendorMap vendors={vendors} userLocation={userLocation} />
          </div>
        )}
      </div>
    </div>
  );
}
