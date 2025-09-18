// import { create } from "zustand";

// import { getSocket } from "../services/chat.service";



// const useStatusStore = create((set, get) => ({
//   statuses: [],
//   loading: false,
//   error: null,

// // Active
// setStatuses : (statuses) => set({ statuses }),
// setLoading : (loading) => set({ loading }),
// setError : (error) => set({ error }),

// // Initialize the socket listeners
// initializeSocket : () => {
//   const socket = getSocket();
//   if (!socket) return;

//   // Real-time status events
//   socket.on("new_status", (newStatus) => {
//     set((state) => ({
//       statuses: state.statuses.some((s) => s._id === newStatus._id)
//         ? state.statuses
//         : [newStatus, ...state.statuses],
//     }))
//   }),

//     socket.on("status_deleted", (statusId) => {
//     set((state) => ({
//       statuses: state.statuses.filter((s) => s._id !== statusId)
       
//     }))
//   }),

//     socket.on("status_viewed", (statusId,viewers) => {
//     set((state) => ({
//       statuses: state.statuses.map((status) => 
//         status._id === statusId ? {...status,viewers}:status )
       
//     }));
//   });

// },

//     cleanupSocket : () => {
//     const socket = getSocket();
//     if (socket) {
//     socket.off("new_status");
//     socket.off("status_deleted");
//     socket.off("status_viewed");
//   }
// },

// // fetch status
// fetchStatuses : async () => {
//   set({ loading: true, error: null });
//   try {
//     const { data } = await axiosInstance.get("status");
//     set({ statuses: data.data || [], loading: false });
//   } catch (error) {
//     console.error("Error fetching status", error);
//     set({ error: error.message, loading: false });
//   }
// },


// // create status
// createStatus: async() =>









// }));

// export default useStatusStore;
