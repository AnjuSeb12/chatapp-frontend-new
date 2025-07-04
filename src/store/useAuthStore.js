import { create } from "zustand";
import  axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// const BASE_URL = import.meta.env.MODE === "development" ? import.meta.env.VITE_API_BASE_URL : "/";
// const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // connectSocket: () => {
  //   const { authUser } = get();
  //   if (!authUser || get().socket?.connected) return;

  //   const socket = io(BASE_URL, {
  //     // query: {
  //     //   userId: authUser._id,
  //     // },
  //       withCredentials: true,
  //   });
  //   socket.connect();

  //   set({ socket: socket });

  //   socket.on("getOnlineUsers", (userIds) => {
  //     set({ onlineUsers: userIds });
  //   });
  // },
  // disconnectSocket: () => {
  //   if (get().socket?.connected) get().socket.disconnect();
  // },

  connectSocket: () => {
  const { authUser } = get();
  if (!authUser || get().socket?.connected) return;

  const socket = io(SOCKET_URL, {
    withCredentials: true,           // ✅ Ensure cookie is sent
    transports: ["websocket"],       // ✅ Force websocket transport (Render supports it)
  });

  set({ socket }); // ✅ Save socket to store

  // ✅ Optional: debugging connection
  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect error:", err.message);
  });

  socket.on("getOnlineUsers", (userIds) => {
    set({ onlineUsers: userIds });
  });
}

}));
