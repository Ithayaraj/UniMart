import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Image, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, updateDoc, increment, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ route, navigation }) {
    const { conversationId, otherUserId, otherUserName, productId, productName } = route.params;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUserProfile, setOtherUserProfile] = useState(null);
    const flatListRef = useRef(null);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        loadOtherUserProfile();
        markAsRead();
        
        // Simple query without orderBy to avoid index requirement
        const q = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversationId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort in memory by timestamp
            msgs.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });
            
            setMessages(msgs);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }, (error) => {
            console.error('Error loading messages:', error);
        });

        return () => unsubscribe();
    }, []);

    const loadOtherUserProfile = async () => {
        try {
            const docRef = doc(db, 'users', otherUserId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setOtherUserProfile(docSnap.data());
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const markAsRead = async () => {
        try {
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                [`unreadCount.${currentUserId}`]: 0
            });
            
            // Mark all messages as read
            const q = query(
                collection(db, 'messages'),
                where('conversationId', '==', conversationId),
                where('senderId', '==', otherUserId)
            );
            
            const snapshot = await getDocs(q);
            const batch = [];
            snapshot.docs.forEach(docSnap => {
                if (!docSnap.data().read) {
                    batch.push(updateDoc(doc(db, 'messages', docSnap.id), { read: true }));
                }
            });
            
            if (batch.length > 0) {
                await Promise.all(batch);
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const messageData = {
                conversationId,
                senderId: currentUserId,
                text: newMessage.trim(),
                timestamp: new Date(),
                read: false
            };

            await addDoc(collection(db, 'messages'), messageData);

            // Update conversation
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                lastMessage: newMessage.trim(),
                lastMessageTime: new Date(),
                [`unreadCount.${otherUserId}`]: increment(1)
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderMessage = ({ item }) => {
        const isMyMessage = item.senderId === currentUserId;
        const isRead = item.read || false;
        
        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isMyMessage ? styles.myText : styles.otherText]}>
                        {item.text}
                    </Text>
                    <View style={styles.messageFooter}>
                        <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.otherTimestamp]}>
                            {item.timestamp?.seconds 
                                ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                })
                                : 'Now'}
                        </Text>
                        {isMyMessage && (
                            <View style={styles.readReceipt}>
                                {isRead ? (
                                    // Double tick - message read
                                    <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.8)" />
                                ) : (
                                    // Single tick - message sent
                                    <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.6)" />
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.headerContent}
                        onPress={() => {
                            if (productId) {
                                navigation.navigate('ProductDetails', { productId });
                            }
                        }}
                    >
                        {otherUserProfile?.profileImage ? (
                            <Image source={{ uri: otherUserProfile.profileImage }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <Ionicons name="person" size={20} color="#999" />
                            </View>
                        )}
                        <View style={styles.headerText}>
                            <Text style={styles.headerName}>{otherUserName}</Text>
                            {productName && (
                                <Text style={styles.headerProduct} numberOfLines={1}>
                                    <Ionicons name="pricetag" size={10} color="#666" /> {productName}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            />

            {/* Input - Fixed at bottom */}
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={500}
                        onFocus={() => {
                            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
                        }}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    safeArea: { backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    backButton: { padding: 5 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20 },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerText: { flex: 1, marginLeft: 10 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#333' },
    headerProduct: { fontSize: 12, color: '#666', marginTop: 2 },
    messagesList: { padding: 15, paddingBottom: 10 },
    messageContainer: { marginBottom: 12, maxWidth: '75%' },
    myMessage: { alignSelf: 'flex-end' },
    otherMessage: { alignSelf: 'flex-start' },
    messageBubble: { borderRadius: 16, padding: 12 },
    myBubble: { backgroundColor: '#4A90E2' },
    otherBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' },
    messageText: { fontSize: 15, lineHeight: 20 },
    myText: { color: '#fff' },
    otherText: { color: '#333' },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4
    },
    timestamp: { fontSize: 10 },
    myTimestamp: { color: 'rgba(255,255,255,0.7)' },
    otherTimestamp: { color: '#999' },
    readReceipt: {
        marginLeft: 2
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'flex-end'
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        marginRight: 10
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center'
    },
    sendButtonDisabled: { opacity: 0.5 }
});
