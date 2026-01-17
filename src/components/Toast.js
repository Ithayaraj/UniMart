import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Toast = ({ message, type = 'info', onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    }, []);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            default: return '#333';
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'success': return 'checkmark-circle-outline';
            case 'error': return 'alert-circle-outline';
            default: return 'information-circle-outline';
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity, backgroundColor: getBackgroundColor() }]}>
            <Ionicons name={getIconName()} size={24} color="#fff" style={styles.icon} />
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Moved to top
        left: 20,
        right: 20,
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    icon: {
        marginRight: 10,
    },
    message: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    }
});

export default Toast;
