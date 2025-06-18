import ApiBlock from "./components/apiBlock";

export default function page() {
    return (
        <div className="min-h-screen flex items-start justify-center px-4 py-8">
            <div className="w-full max-w-4xl space-y-8">
                <ApiBlock
                    apiName={"管理員新增菜單"}
                    apiType={"post"}
                    apiUrl={"/api/menu"}
                    authorizationList={["OWNER"]}
                    bodyObj={{
                        name: "新菜點",
                        description: "餐點敘述",
                        price: 100,
                        imageUrl: "/food01.jpg",
                        isAvailable: true,
                    }}
                />
                <ApiBlock
                    apiName={"管理員編輯菜單"}
                    apiType={"put"}
                    apiUrl={"/api/menu/:menuId"}
                    authorizationList={["OWNER"]}
                    bodyObj={{
                        name: "經典蛋餅",
                        description:
                            "香煎蛋餅搭配醬油膏與胡椒，酥脆外皮包覆滑嫩蛋香。",
                        price: 35,
                        imageUrl: "/food01.jpg",
                        isAvailable: true,
                    }}
                />
                <ApiBlock
                    apiName={"取得所有菜單"}
                    apiType={"get"}
                    apiUrl={"/api/menu"}
                    authorizationList={["全部"]}
                    responseObj={[
                        {
                            id: "menuItemId",
                            name: "經典蛋餅",
                            description:
                                "香煎蛋餅搭配醬油膏與胡椒，酥脆外皮包覆滑嫩蛋香。",
                            price: 35,
                            imageUrl: "/food01.jpg",
                            isAvailable: true,
                            createdAt: "2025-05-27T19:08:03.738Z",
                            updatedAt: "2025-05-29T07:21:46.635Z",
                        },
                    ]}
                />
                <ApiBlock
                    apiName={"顧客下單"}
                    apiDescription={
                        "根據orderItems查找資料庫中對應的menu，並依此新增一筆order及對應的orderItems"
                    }
                    apiType={"post"}
                    apiUrl={"/api/orders"}
                    authorizationList={["全部"]}
                    bodyObj={{
                        customerId: "customerId",
                        orderItems: [
                            {
                                menuItemId: "menuItemId",
                                quantity: 1,
                                specialRequest: "備註",
                            },
                        ],
                    }}
                />
                <ApiBlock
                    apiName={"取得所有待處理訂單"}
                    apiType={"get"}
                    apiUrl={"/api/orders/pending"}
                    authorizationList={["OWNER", "STAFF"]}
                    responseObj={[
                        {
                            id: "orderId",
                            status: "PENDING",
                            paymentStatus: false,
                            totalAmount: 80,
                            createdAt: "2025-06-03T12:24:03.857Z",
                            customer: {
                                name: "customer",
                            },
                            items: [
                                {
                                    id: "menuItemId",
                                    quantity: 1,
                                    specialRequest: "餐點備註",
                                    menuItem: {
                                        name: "經典蛋餅",
                                        price: 35,
                                    },
                                },
                            ],
                        },
                    ]}
                />

                <ApiBlock
                    apiName={"根據status更改訂單狀態"}
                    apiType={"patch"}
                    apiUrl={"/api/orders/:orderId/status"}
                    authorizationList={["全部"]}
                    bodyObj={{ status: "PENDING" }}
                />
                <ApiBlock
                    apiName={"獲取顧客訂單"}
                    apiType={"get"}
                    apiUrl={"/api/orders/customers/:customerId"}
                    authorizationList={["全部"]}
                    responseObj={[
                        {
                            id: "orderId",
                            status: "COMPLETED",
                            paymentStatus: false,
                            totalAmount: 45,
                            createdAt: "2025-06-03T12:34:33.823Z",
                            items: [
                                {
                                    id: "menuItemId",
                                    menuItem: {
                                        name: "火腿起司三明治",
                                        price: 45,
                                    },
                                    quantity: 1,
                                    specialRequest: "hehe",
                                },
                            ],
                        },
                    ]}
                />
                {/* TODO:繼續 */}
            </div>
        </div>
    );
}
