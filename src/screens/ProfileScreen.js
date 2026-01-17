import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useToast } from '../context/ToastContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
    const { showToast } = useToast();
    const [profile, setProfile] = useState(null);
    const userEmail = auth.currentUser?.email || 'user@example.com';

    useEffect(() => {
        loadProfile();
        const unsubscribe = navigation.addListener('focus', () => {
            loadProfile();
        });
        return unsubscribe;
    }, [navigation]);

    const loadProfile = async () => {
        try {
            const userId = auth.currentUser?.uid;
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setProfile(docSnap.data());
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            showToast('Logged out successfully', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const displayName = profile?.name || userEmail.split('@')[0];
    const displayMobile = profile?.mobile || 'Not set';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
            {/* Header */}
            <LinearGradient 
                colors={['#4A90E2', '#5BA3F5']} 
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Ionicons name="create-outline" size={20} color="#fff" />
                </TouchableOpacity>

                <View style={styles.profileHeader}>
                    <TouchableOpacity 
                        style={styles.avatarContainer}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        {profile?.profileImage ? (
                            <Image 
                                source={{ uri: profile.profileImage }} 
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Ionicons name="person" size={40} color="#fff" />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{userEmail}</Text>
                    {profile?.mobile && (
                        <View style={styles.mobileContainer}>
                            <Ionicons name="call" size={14} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.userMobile}>{displayMobile}</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    
                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('MyProducts')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="bag-handle-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>My Products</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Favorites')}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="heart-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>Favorites</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="notifications-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="shield-checkmark-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>Privacy & Security</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="help-circle-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="information-circle-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>About UniMart</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="document-text-outline" size={22} color="#4A90E2" />
                        </View>
                        <Text style={styles.menuText}>Terms & Conditions</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={22} color="#fff" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0</Text>
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f7fa' 
    },
    header: {
        paddingTop: 25,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    editButton: {
        position: 'absolute',
        top: 25,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    profileHeader: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 4
    },
    mobileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4
    },
    userMobile: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500'
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 5,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginLeft: 15,
        marginTop: 10,
        marginBottom: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#ff3b30',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#ff3b30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    version: {
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
        marginTop: 20,
    }
});
