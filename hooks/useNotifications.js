"use client";

import { useEffect, useState } from "react";
import useUser from "./user";

export default function useNotifications() {
    const { user, loading: userLoading } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLoading) {
            return;
        }
        const timeout = setTimeout(async () => {
            const userId = user.id;
            if (!userId) {
                return;
            }
            const response = await fetch(`/api/notifications/users/${userId}`);
            if (!response.ok) {
                console.error(response);

                return;
            }
            const data = await response.json();

            const formedData = data.map((item) => {
                return {
                    id: item.id,
                    title: "訂單",
                    type: "order",
                    content: item.message,
                    read: item.isRead,
                    time: new Date(item.createdAt).toLocaleString("sv"),
                };
            });
            setNotifications(formedData);
            setUnreadCount(formedData.filter((n) => !n.read).length);
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [user, userLoading]);
    const notificationSetter = (notifications) => {
        console.log(notifications);

        setNotifications(notifications);
        const unreadCount = notifications.filter((n) => n.read == false).length;
        // console.log(notifications.filter((n) => n.read == false));
        //

        setUnreadCount(unreadCount);
    };

    return {
        notifications,
        setNotifications: notificationSetter,
        unreadCount,
        loading,
    };
}
