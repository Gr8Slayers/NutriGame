import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Animated, Dimensions, Easing, Text, FlatList, Modal, Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { GiftedChat, Avatar, IMessage, Bubble, MessageText, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { TypingAnimation } from 'react-native-typing-animation';
import * as SecureStore from 'expo-secure-store';
import { useLanguage } from '../i18n/LanguageContext';

import styles from '../styles/Chatbot';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '@env';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.7;

export default function Chatbot() {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<IMessage[]>([]);
    const navigation = useNavigation();
    const [showMenu, setShowMenu] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [chatID, setChatID] = useState<string | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);

    const slideAnim = React.useRef(new Animated.Value(-MENU_WIDTH)).current;


    const toggleMenu = () => {
        if (showMenu) {
            Animated.timing(slideAnim, {
                toValue: -MENU_WIDTH,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start(() => setShowMenu(false));
        } else {
            setShowMenu(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }).start();
        }
    };

    useEffect(() => {
        setMessages(setNewChat());
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) return;

            const response = await fetch(`${API_URL}/api/chat/history`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.history && Array.isArray(data.history)) {
                    setHistory(data.history);
                }
            }
        } catch (error) {
            console.error('Geçmiş çekilirken hata:', error);
        }
    };

    const setNewChat = (): IMessage[] => {
        return [
            {
                _id: 1,
                text: t('chatbot_greeting'),
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: t('chatbot_bot_name'),
                    avatar: require('../assets/logo.png'),
                },
            },
        ]
    }

    /**
     * Sends the user's message to the backend chatbot API and appends the AI response.
     */
    const onSend = useCallback(async (newMessages: IMessage[] = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

        const userMessage = newMessages[0]?.text;
        if (!userMessage) return;

        // Update local history state
        setHistory(prevHistory => {
            if (chatID) {
                return prevHistory.map(chat =>
                    chat.id === chatID
                        ? { ...chat, messages: GiftedChat.append(chat.messages, newMessages) }
                        : chat
                );
            } else {
                // Will be updated once we get chatId from backend
                return prevHistory;
            }
        });

        // Show typing indicator
        setIsTyping(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) {
                Alert.alert(t('error'), t('chatbot_login_required'));
                setIsTyping(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: userMessage,
                    chatId: chatID,
                }),
            });

            const data = await response.json();
            console.log("Sunucudan Gelen Saf Yanıt:", data);

            if (!response.ok) {
                // Handle rate limit error
                if (response.status === 429) {
                    Alert.alert(t('chatbot_rate_limit_title'), data.message || t('chatbot_ai_error'));
                } else {
                    Alert.alert(t('error'), data.message || t('chatbot_ai_error'));
                }
                setIsTyping(false);
                return;
            }

            // Update chatId if this is a new conversation
            const backendChatId = data.chatId;
            if (!chatID && backendChatId) {
                setChatID(backendChatId);

                // Sol menüye (history listesine) yeni sohbetin sadece başlığını ekle
                setHistory(prevHistory => [
                    { id: backendChatId, title: userMessage, createdAt: new Date().toISOString() },
                    ...prevHistory
                ]);
            }

            // AI cevabını ekranda göster
            const aiMessage: IMessage = {
                _id: Date.now(),
                text: data.response,
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: 'AI Bot',
                    avatar: require('../assets/logo.png'),
                },
            };

            setMessages(previousMessages => GiftedChat.append(previousMessages, [aiMessage]));


        } catch (error: any) {
            console.error('Chatbot API error:', error);
            Alert.alert(t('chatbot_connection_error_title'), t('chatbot_connection_error'));
        } finally {
            setIsTyping(false);
        }
    }, [chatID]);

    const renderBubble = (props: any) => {
        const { currentMessage } = props;

        if (currentMessage.user._id === 2) {
            return (
                <View style={styles.botMessageContainer}>
                    <Bubble
                        {...props}
                        wrapperStyle={{
                            left: {
                                backgroundColor: 'transparent',
                                marginLeft: 0,
                            }
                        }}
                        containerStyle={{
                            left: {
                                marginTop: 10,
                            }
                        }}
                        renderTime={() => null}
                    />
                </View>
            );
        }

        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#ABC270',
                        borderRadius: 20,
                        padding: 5,
                    }
                }}
            />
        );
    };

    const renderMessageText = (props: any) => {
        const { currentMessage } = props;

        if (currentMessage.user._id === 2) {
            return (
                <View style={{ paddingHorizontal: 10, paddingTop: 5 }}>
                    <Markdown style={markdownStyles}>
                        {currentMessage.text}
                    </Markdown>
                </View>
            );
        }

        return <MessageText {...props} />;
    };


    const renderInputToolbar = (props: any) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={styles.inputToolbar}
                primaryStyle={styles.inputContainer}
            />
        );
    };

    const renderComposer = (props: any) => {
        return (
            <Composer
                {...props}
                textInputStyle={styles.composer}
                placeholder={t('chatbot_message_placeholder')}
                placeholderTextColor={'#8e8e93'}
                multiline={true}
            />
        );
    };

    const renderSend = (props: any) => {
        return (
            <Send
                {...props}
                alwaysShowSend={true}
                containerStyle={styles.sendContainer}
            >
                <View style={styles.sendButton}>
                    <Ionicons name="arrow-up" size={24} color="#ffffff" />
                </View>
            </Send>
        );

    };

    const renderFooter = () => {
        if (!isTyping) return null;

        return (
            <View style={{
                padding: 10,
                marginLeft: 10,
                marginBottom: 5,
                flexDirection: 'row',
                alignItems: 'center'
            }}>

                <View style={{
                    backgroundColor: 'transparent',
                    paddingVertical: 8,
                    paddingHorizontal: 15,
                    borderRadius: 20,
                }}>
                    <TypingAnimation
                        dotColor="#ABC270"
                        dotMargin={5}
                        dotRadius={3}
                        dotY={0}
                    />
                </View>
            </View>
        );
    };

    const loadChat = async (chat: any) => {
        setChatID(chat.id);
        toggleMenu();

        setMessages([]);

        try {
            const token = await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/chat/history/${chat.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages) {
                    const messagesWithAvatar = data.messages.map((msg: any) => {
                        if (msg.user._id === 2) { // Eğer mesaj AI'a aitse
                            return {
                                ...msg,
                                user: {
                                    ...msg.user,
                                    avatar: require('../assets/logo.png')
                                }
                            };
                        }
                        return msg; // Kullanıcı mesajıysa aynen bırak
                    });

                    setMessages(messagesWithAvatar);
                }
            } else {
                Alert.alert(t('error'), t('chat_load_error'));
            }
        } catch (error) {
            console.error('Sohbet yüklenirken hata:', error);
        }
    };

    const renderHistoryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.historyItem}
            onPress={() => loadChat(item)}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: 'white', fontWeight: 'bold' }}>
                        {item.title || t('chatbot_new_chat')}
                    </Text>

                    <Text style={{ color: '#aaa', fontSize: 10 }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        setSelectedChatId(item.id);
                        setDeleteModalVisible(true);
                    }}
                    style={{ padding: 5 }}
                >
                    <Ionicons
                        name="ellipsis-horizontal"
                        size={24}
                        color="#ffffff"
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const deleteChat = async (chatIdToDelete: string) => {
        // Also delete on backend
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                await fetch(`${API_URL}/api/chat/${chatIdToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to delete chat on backend:', error);
        }

        setHistory((prevHistory) =>
            prevHistory.filter((chat) => chat.id !== chatIdToDelete)
        );
        setDeleteModalVisible(false);
        setSelectedChatId(null);
        openNewChat();
    };

    const openNewChat = () => {
        setChatID(null); // üstüne güncel mesajları kaydetmesin diye
        setMessages(setNewChat());
        if (showMenu) toggleMenu();
    }

    return (
        <>
            {/* Delete Chat Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    activeOpacity={1}
                    onPress={() => setDeleteModalVisible(false)}
                >
                    <View
                        style={{
                            backgroundColor: '#2c2c2e',
                            borderRadius: 16,
                            padding: 20,
                            width: '80%',
                            maxWidth: 300,
                        }}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                            {t('delete_chat')}
                        </Text>
                        <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 20 }}>
                            {t('delete_chat_confirm')}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setDeleteModalVisible(false)}
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 20,
                                    borderRadius: 8,
                                    backgroundColor: '#3a3a3c',
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: '600' }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => selectedChatId && deleteChat(selectedChatId)}
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 20,
                                    borderRadius: 8,
                                    backgroundColor: '#ff3b30',
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: '600' }}>{t('delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>


            <View style={styles.container}>

                {showMenu && (
                    //overlay katmanı oluşturuluyo kullancıı overlaye bastığında menü kapanır
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={toggleMenu}
                    />
                )}


                <Animated.View style={[
                    styles.menuContainer,
                    {
                        transform: [{ translateX: slideAnim }],
                        zIndex: 100,
                    }
                ]}>
                    <View style={styles.menuHeader}>
                        <Text style={styles.menuTitle}>{t('chatbot_menu_title')}</Text>
                        <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#ffffff" />
                        </TouchableOpacity>

                    </View>

                    <TouchableOpacity style={styles.menuItem} onPress={openNewChat}>
                        <Ionicons name="add-circle-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                        <Text style={styles.menuText}>{t('chatbot_new_chat')}</Text>
                    </TouchableOpacity>
                    <View style={styles.menuItem}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                        <Text style={styles.menuSubTitle}>{t('history')}</Text>
                    </View>
                    <FlatList
                        data={history}
                        renderItem={renderHistoryItem}

                        style={{ overflow: 'visible' }}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        keyboardShouldPersistTaps="always"
                        ListEmptyComponent={() => (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#666' }}>{t('no_history')}</Text>
                            </View>
                        )}
                    />

                </Animated.View>

                <View style={styles.chatContainer}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                            <Ionicons name="menu" size={24} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>{t('chatbot_title')}</Text>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                        <GiftedChat
                            messages={messages}
                            onSend={messages => onSend(messages)}
                            user={{ _id: 1 }}
                            isTyping={isTyping}
                            renderFooter={renderFooter}
                            renderBubble={renderBubble}
                            renderMessageText={renderMessageText}
                            renderInputToolbar={renderInputToolbar}
                            renderComposer={renderComposer}
                            renderSend={renderSend}
                            minInputToolbarHeight={60}
                            renderAvatar={(props) => {
                                return (
                                    <Avatar
                                        {...props}
                                        containerStyle={{

                                            left: { marginRight: 0 },
                                            right: {}
                                        }}
                                        imageStyle={{
                                            left: {
                                                width: 50,
                                                height: 50,
                                                borderRadius: 25,
                                            },
                                            right: {},
                                        }}


                                    />
                                );
                            }}
                        />
                    </KeyboardAvoidingView>
                </View>
            </View >
        </>
    );
}



const markdownStyles = {
    body: { fontSize: 16, color: '#ffffffff', lineHeight: 24, backgroundColor: '#transparent' },
    code_inline: { backgroundColor: '#f4f4f4', borderRadius: 4, padding: 2 },
    fence: { backgroundColor: '#f4f4f4', padding: 10, borderRadius: 8, marginVertical: 5 },
};
