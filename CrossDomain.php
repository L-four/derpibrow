<?php

$info = '';
$json = array();
$output = '';


if (empty($_GET['url']) && empty($_GET['img'])) {
	$json[] = '"error":"no args"';
	$output = render_json($json);
}
elseif (!empty($_GET['url'])) {
	// use $ because i can
	$output = file_get_contents(urldecode($_GET['url']));	
}
elseif (!empty($_GET['img'])) {
	$folder = 'img';
	$file_name = basename($_GET['img']);
	$file_name = urldecode(urldecode($file_name));

	$info .= "__" . $url . '__';
	
	$file = __DIR__ . '/' . $folder . '/' . $file_name;
	if (!file_exists($file)) {
		$url = $_GET['img'];
		if ($_GET['urlencodings']) {
			$encodes = (int) $_GET['urlencodings'];
			if ($encodes < 10) {
				while ($encodes > 0) {
					$url = urldecode($url);
					$encodes--;
				}
			}
		}
		$imgData = file_get_contents($url);	
		$success = file_put_contents($file, $imgData);

		$json[] = '"return":"' . $success . '"';
	}
	else {
		$info .= 'Image exists.';
	}
	
	$json[] = '"img":"http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/' . $folder . '/' . $file_name .'"';

	if ($info) {
		$json[] = '"info":"' . $info . '"';
	}

	$output = render_json($json);
}

function render_json ($json){
	return '{' . implode(',', $json) . '}';
}


print $output; 