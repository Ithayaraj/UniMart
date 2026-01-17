import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MessagesScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        // Simple query without orderBy to avoid index requirement
        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUserId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Filter out conversations with no messages (empty lastMessage)
            const activeConvos = convos.filter(convo => 
                convo.lastMessage && convo.lastMessage.trim() !== ''
            );
            
            // Sort in memory instead of using Firestore orderBy
            activeConvos.sort((a, b) => {
                const timeA = a.lastMessageTime?.seconds || 0;
                const timeB = b.lastMessageTime?.seconds || 0;
                return timeB - timeA;
            });
            
            setConversations(activeConvos);
            setLoading(false);
        }, (error) => {
            console.error('Error loading conversations:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteConversation = (conversationId, productName) => {
        Alert.alert(
            'Delete Conversation',
            `Delete chat about "${productName}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'conversations', conversationId));
                            // Optionally delete all messages in this conversation
                            // (For now, just deleting the conversation document)
                        } catch (error) {
                            console.error('Error deleting conversation:', error);
                            Alert.alert('Error', 'Failed to delete conversation');
                        }
                    }
                }
            ]
        );
    };

    const renderConversation = ({ item }) => {
        const otherUserId = item.participants.find(id => id !== currentUserId);
        const otherUserName = item.participantNames?.[otherUserId] || 'User';
        const otherUserImage = item.participantImages?.[otherUserId];
        const unreadCount = item.unreadCount?.[currentUserId] || 0;

        return (
            <TouchableOpacity
                style={styles.conversationCard}
                onPress={() => navigation.navigate('Chat', {
                    conversationId: item.id,
                    otherUserId: otherUserId,
                    otherUserName: otherUserName,
                    productId: item.productId,
                    productName: item.productName
                })}
                onLongPress={() => handleDeleteConversation(item.id, item.productName)}
            >
                <View style={styles.avatarContainer}>
                    {otherUserImage ? (
                        <Image source={{ uri: otherUserImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={24} color="#999" />
                        </View>
                    )}
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.userName}>{otherUserName}</Text>
                        <Text style={styles.time}>
                            {item.lastMessageTime?.seconds 
                                ? formatTime(new Date(item.lastMessageTime.seconds * 1000))
                                : 'Now'}
                        </Text>
                    </View>
                    {item.productName && (
                        <View style={styles.productBadge}>
                            <Ionicons name="pricetag" size={12} color="#4A90E2" />
                            <Text style={styles.productName} numberOfLines={1}>
                                {item.productName}
                            </Text>
                        </View>
                    )}
                    <Text 
                        style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} 
                        numberOfLines={2}
                    >
                        {item.lastMessage || 'Tap to start chatting about this product'}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
        );
    };

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient 
                colors={['#4A90E2', '#5BA3F5']} 
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Messages</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="chatbubbles-outline" size={80} color="#ddd" />
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubtext}>
                                Start chatting with sellers!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    header: {
        paddingTop: 25,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    conversationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    avatarContainer: { position: 'relative', marginRight: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#ff3b30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    conversationContent: { flex: 1 },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    userName: { fontSize: 16, fontWeight: '700', color: '#333' },
    time: { fontSize: 12, color: '#999' },
    productBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f7ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 6,
        alignSelf: 'flex-start',
        gap: 4
    },
    productName: { 
        fontSize: 12, 
        color: '#4A90E2', 
        fontWeight: '600',
        maxWidth: 200
    },
    lastMessage: { fontSize: 14, color: '#666' },
    unreadMessage: { fontWeight: '600', color: '#333' },
    empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, color: '#999', marginTop: 20, fontWeight: '600' },
    emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' }
});
