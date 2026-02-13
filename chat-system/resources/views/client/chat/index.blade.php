<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Chat Nội Bộ - QVC</title>
    
    {{-- Pass User Data to React --}}
    <script>
        window.Laravel = {
            csrfToken: "{{ csrf_token() }}",
            user: {
                id: {{ auth()->id() }},
                name: "{{ auth()->user()->name }}",
                avatar: "{{ auth()->user()->avatar_url }}"
            }
        };
    </script>
    
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-gray-100 h-screen overflow-hidden font-sans">
    <div id="app" class="h-full w-full"></div>
</body>
</html>