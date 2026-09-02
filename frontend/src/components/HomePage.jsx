import React, { useEffect } from 'react';
import Layout from './Layout';
import { motion } from 'framer-motion';
import ChatList from '../pages/chatSection/ChatList';
import { getAllUsers } from '../services/user.service';
import { useChatStore } from '../store/chatStore';

const HomePage = () => {
  const { contacts, setContacts, initUsersStatus } = useChatStore();

  const getAllUser = async () => {
    try {
      const result = await getAllUsers();
      if (result.status === 'success' && Array.isArray(result.data)) {
        setContacts(result.data);
        initUsersStatus(result.data);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  useEffect(() => {
    getAllUser();
  }, []);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <ChatList contacts={contacts} />
      </motion.div>
    </Layout>
  );
};

export default HomePage;
