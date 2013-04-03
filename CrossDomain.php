<?php

if (empty($_GET['url']) && empty($_GET['img'])) {
	print '{error:"no args"}';
	exit();
}
elseif (!empty($_GET['url'])) {
	// use $ because i can
	print file_get_contents(urldecode($_GET['url']));	
}
elseif (!empty($_GET['img'])) {
	$folder = 'img';
	$file_name = basename($_GET['img']);
	$file = __DIR__ . '/' . $folder . '/' . $file_name;

	if (!file_exists($file)) {
		$imgData = file_get_contents(urldecode($_GET['img']));	
		file_put_contents($file, $imgData);
	}

	print '{"img":"http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/' . $folder . '/' . $file_name .'"}';
}