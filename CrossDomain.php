<?php
if (empty($_GET['url'])) {
	print '{error:"no args"}';
	exit();
}
// use $ because i can
print file_get_contents(urldecode($_GET['url']));