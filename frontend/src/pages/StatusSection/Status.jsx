// import React, { useEffect } from "react";

// import useStatusStore from "../../store/useStatusStore";
// import useAuthStore from "../../store/useAuthStore";
// import { getSocket } from "../../services/chat.service";

// const Status = () => {
//   const { fetchStatuses, handleSocketEvents } = useStatusStore();
//   const { token } = useAuthStore();
//   const socket = getSocket();

//   useEffect(() => {
//     fetchStatuses(token);
//     if (socket) {
//       handleSocketEvents(socket);
//     }
//   }, [token, socket, fetchStatuses, handleSocketEvents]);

//   return (
//     <div className="p-4">
//       <StatusUploader />
//       <StatusList />
//     </div>
//   );
// };

// export default Status;
