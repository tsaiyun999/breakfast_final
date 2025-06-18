"use client";

import { useEffect, useRef, useState } from "react";
import useNotifications from "@/hooks/useNotifications";
import useUser from "@/hooks/user";

export default function NotifyButton() {
    const [showNotify, setShowNotify] = useState(false);
    const { user, loading } = useUser();
    const { notifications, unreadCount, setNotifications } = useNotifications();
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (loading) {
            return;
        }
        const handleClickOutside = (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target)
            ) {
                setShowNotify(false);
            }
        };
        if (showNotify) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotify, loading]);

    const handelClickNotificationButton = async () => {
        setShowNotify((prev) => !prev);
        setNotifications(
            notifications.map((n) => {
                return { ...n, read: true };
            })
        );
        try {
            const response = await fetch(
                `/api/notifications/users/${user.id}/isRead`,
                {
                    method: "PATCH",
                }
            );
            if (!response.ok) {
                alert("切換已讀通知失敗");
            }
        } catch (err) {
            alert("錯誤：", err);
        }
    };
    return (
        <div className="relative" ref={wrapperRef}>
            <button
                aria-label="查看通知"
                className="relative focus:outline-none"
                onClick={handelClickNotificationButton}
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-400 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showNotify && (
                <div className="fixed right-1/12 top-16 w-80 bg-white/90 backdrop-blur-md text-black rounded-xl shadow-2xl border border-gray-200 z-[9999]">
                    {notifications.length > 0 ? (
                        <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                            {notifications.map((n) => (
                                <li
                                    key={n.id}
                                    className="px-4 py-3 hover:bg-gray-100 transition"
                                >
                                    <div className="font-semibold text-gray-800">
                                        {n.title}
                                    </div>
                                    <div className="text-sm text-gray-800">
                                        {n.content}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {n.time}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-5 text-center text-gray-500 text-sm">
                            目前沒有通知
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
