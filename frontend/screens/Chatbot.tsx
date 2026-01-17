import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Animated, Dimensions, Easing, Text, FlatList } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { GiftedChat, Avatar, IMessage, Bubble, MessageText, BubbleProps, MessageTextProps, InputToolbar, Composer, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/Chatbot';
import { useNavigation } from '@react-navigation/native';


const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.7;

export default function Chatbot() {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const navigation = useNavigation();
    const [showMenu, setShowMenu] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [chatID, setChatID] = useState<string | number | null>(null);

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
    }, []);

    const setNewChat = (): IMessage[] => {
        return [
            {
                _id: 1,
                text: 'Hello! I am your AI assistant. How can I help you?',
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: 'AI Bot',
                    avatar: require('../assets/logo.png'),
                },
            },
        ]
    }

    const onSend = useCallback((messages: IMessage[] = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));
        setHistory(prevHistory => {
            if (chatID) { //zaten kayıtlı chat varsa güncelle
                return prevHistory.map(chat =>
                    chat.id === chatID
                        ? { ...chat, messages: GiftedChat.append(chat.messages, messages) }
                        : chat
                );
            } else {
                const newChatId = Date.now().toString();
                setChatID(newChatId);
                const newChatSession = {
                    id: newChatId,
                    title: messages[0].text,
                    createdAt: new Date(),
                    messages: GiftedChat.append(setNewChat(), messages)
                };
                return [newChatSession, ...prevHistory];
            }
        });
    }, [chatID, setNewChat()]);

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
                placeholder={'Msage...'}
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

    const loadChat = (chat: any) => {
        setChatID(chat.id);
        setMessages(chat.messages);
        setShowMenu(false);
    };

    const renderHistoryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.historyItem}
            onPress={() => loadChat(item)}
        >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#ccc" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: 'white', fontWeight: 'bold' }}>
                    {item.title || "Yeni Sohbet"}
                </Text>
                <Text style={{ color: '#aaa', fontSize: 10 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const openNewChat = () => {
        setMessages(setNewChat());
        toggleMenu();
    }

    return (
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
                    transform: [{ translateX: slideAnim }]
                }
            ]}>
                <View style={styles.menuHeader}>
                    <Text style={styles.menuTitle}>Menu</Text>
                    <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>

                </View>

                <TouchableOpacity style={styles.menuItem} onPress={openNewChat}>
                    <Ionicons name="add-circle-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                    <Text style={styles.menuText}>New Chat</Text>
                </TouchableOpacity>

                <View style={styles.menuItem}>
                    <Text style={styles.menuSubTitle}>History</Text>
                    <ScrollView>
                        <FlatList
                            data={history}
                            renderItem={renderHistoryItem}

                            ListEmptyComponent={() => (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: '#666' }}>No history.</Text>
                                </View>
                            )}
                        />
                    </ScrollView>
                </View>

            </Animated.View>

            <View style={styles.chatContainer}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
                    <Ionicons name="menu" size={24} color="#ffffff" />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1, }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <GiftedChat
                        messages={messages}
                        onSend={messages => onSend(messages)}
                        user={{ _id: 1 }}
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
    );
}



const markdownStyles = {
    body: { fontSize: 16, color: '#ffffffff', lineHeight: 24, backgroundColor: '#transparent' },
    code_inline: { backgroundColor: '#f4f4f4', borderRadius: 4, padding: 2 },
    fence: { backgroundColor: '#f4f4f4', padding: 10, borderRadius: 8, marginVertical: 5 },
};
