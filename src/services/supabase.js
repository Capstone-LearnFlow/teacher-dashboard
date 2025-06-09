import { createClient } from '@supabase/supabase-js';

// Supabase client configuration - prioritizing NEXT_PUBLIC_ prefix (as used in learnflow-web)
// then falling back to REACT_APP_ prefix if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Add detailed logging for debugging
console.log('🔍 Supabase Configuration:');
console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'MISSING');
console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING');
console.log('  Using NEXT_PUBLIC vars:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
console.log('  Using REACT_APP vars:', Boolean(process.env.REACT_APP_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL));

// Create Supabase client
console.log('🔧 Creating Supabase client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client created');

// Types for chat messages
export const ChatMessageSender = {
  USER: 'USER',
  AI: 'AI'
};

export const ChatMessageMode = {
  ASK: 'ask',
  CREATE: 'create'
};

// Helper function to add prefix to node IDs based on creator type
const addNodeIdPrefix = (nodeId, sender) => {
  // Convert to string if it's not already
  const idStr = String(nodeId);
  
  // If it already has a prefix, return as is
  if (idStr.startsWith('a-') || idStr.startsWith('e-')) {
    return idStr;
  }
  
  // Add prefix based on sender
  if (sender === ChatMessageSender.USER) {
    return `a-${idStr}`; // 'a-' prefix for user-created nodes
  } else {
    return `e-${idStr}`; // 'e-' prefix for AI-created nodes
  }
};

// Function to save a chat message to Supabase
export const saveChatMessage = async (message) => {
  console.log('📤 saveChatMessage called with:', {
    assignment_id: message?.assignment_id,
    node_id: message?.node_id
  });
  
  try {
    // Add prefix to node ID based on sender
    const prefixedNodeId = addNodeIdPrefix(message.node_id, message.sender);
    
    // Prepare message data without parent_node_id
    const messageData = {
      assignment_id: message.assignment_id,
      node_id: prefixedNodeId,
      sender: message.sender,
      message: message.message,
      mode: message.mode,
      user_id: message.user_id || null,
      user_name: message.user_name || null,
      suggestions: message.suggestions || [],
      citations: message.citations || []
    };

    console.log('📝 Preparing to insert message into supabase with prefixed node ID:', prefixedNodeId);
    
    // Insert the message into the database
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select();

    if (error) {
      console.error('❌ Supabase error saving message:', error);
      throw error;
    }
    
    console.log('✅ Message saved successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving chat message:', error);
    return { success: false, error };
  }
};

// Function to load chat messages from Supabase
export const loadChatMessages = async (assignmentId, parentNodeId, nodeId) => {
  console.log('📥 loadChatMessages called with:', { 
    assignmentId, 
    parentNodeId, // Kept for logging but not used in query
    nodeId 
  });
  
  try {
    // Add prefixes to nodeId if not already prefixed
    // Since we don't know the sender type when loading, we'll add both prefixes as possibilities
    const prefixedNodeId = nodeId;
    const isPrefixed = String(nodeId).startsWith('a-') || String(nodeId).startsWith('e-');
    
    // Create base query
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('assignment_id', assignmentId);
    
    // If the node ID already has a prefix, use it directly
    if (isPrefixed) {
      console.log('🔍 Using already prefixed node ID:', nodeId);
      query = query.eq('node_id', nodeId);
    } else {
      // Otherwise, use both possible prefixed versions
      console.log('🔍 Using both potential prefixed node IDs:', `a-${nodeId}`, `e-${nodeId}`);
      query = query.or(`node_id.eq.a-${nodeId},node_id.eq.e-${nodeId}`);
    }
    
    // Add ordering
    query = query.order('created_at', { ascending: true });
    
    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error loading messages:', error);
      throw error;
    }
    
    console.log(`✅ Loaded ${data?.length || 0} messages from Supabase`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error loading chat messages:', error);
    return { success: false, error };
  }
};

// Function to search for relevant messages
export const searchRelevantMessages = async (assignmentId, message, limit = 5) => {
  console.log('🔍 searchRelevantMessages called with:', { assignmentId, messagePreview: message?.substring(0, 20) });
  
  try {
    // Basic text search
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('assignment_id', assignmentId)
      .textSearch('message', message)
      .limit(limit);

    if (error) {
      console.error('❌ Supabase error searching messages:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} relevant messages`);
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ Error searching for messages:', error);
    return { success: false, error };
  }
};

// Function to delete chat messages
export const deleteChatMessages = async (assignmentId, parentNodeId, nodeId) => {
  console.log('🗑️ deleteChatMessages called with:', { assignmentId, parentNodeId, nodeId });
  
  try {
    // Similar to loadChatMessages, handle both prefixed and unprefixed node IDs
    const isPrefixed = String(nodeId).startsWith('a-') || String(nodeId).startsWith('e-');
    
    // Create base query
    let query = supabase
      .from('chat_messages')
      .delete()
      .eq('assignment_id', assignmentId);
    
    // If the node ID already has a prefix, use it directly
    if (isPrefixed) {
      query = query.eq('node_id', nodeId);
    } else {
      // Otherwise, use both possible prefixed versions
      query = query.or(`node_id.eq.a-${nodeId},node_id.eq.e-${nodeId}`);
    }
    
    // Execute query
    const { error } = await query;

    if (error) {
      console.error('❌ Supabase error deleting messages:', error);
      throw error;
    }
    
    console.log('✅ Messages deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting chat messages:', error);
    return { success: false, error };
  }
};