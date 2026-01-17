import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FavoritesScreen({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const userId = auth.currentUser?.uid;
            const favKey = `favorites_${userId}`;
            const favIds = await AsyncStorage.getItem(favKey);
            
            if (favIds) {
                const ids = JSON.parse(favIds);
                if (ids.length > 0) {
                    const productsRef = collection(db, 'products');
                    const snapshot = await getDocs(productsRef);
                    const allProducts = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    const favProducts = allProducts.filter(p => ids.includes(p.id));
                    setFavorites(favProducts);
                }
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (productId) => {
        try {
            const userId = auth.currentUser?.uid;
            const favKey = `favorites_${userId}`;
            const favIds = await AsyncStorage.getItem(favKey);
            
            if (favIds) {
                const ids = JSON.parse(favIds);
                const newIds = ids.filter(id => id !== productId);
                await AsyncStorage.setItem(favKey, JSON.stringify(newIds));
                setFavorites(favorites.filter(p => p.id !== productId));
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
        >
            <Image 
                source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} 
                style={styles.image} 
            />
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>Rs. {item.price}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            </View>
            <TouchableOpacity 
                style={styles.heartButton}
                onPress={() => removeFavorite(item.id)}
            >
                <Ionicons name="heart" size={24} color="#ff3b30" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Favorites</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={item => item.id}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="heart-outline" size={80} color="#ddd" />
                            <Text style={styles.emptyText}>No favorites yet</Text>
                            <Text style={styles.emptySubtext}>
                                Start adding products to your favorites!
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    image: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0' },
    content: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
    price: { fontSize: 15, fontWeight: 'bold', color: '#28a745', marginBottom: 4 },
    description: { fontSize: 13, color: '#666' },
    heartButton: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8
    },
    empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, color: '#999', marginTop: 20, fontWeight: '600' },
    emptySubtext: { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center' }
});
