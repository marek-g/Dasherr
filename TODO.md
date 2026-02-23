# TODO

## Colorful progress bars

``` html
<!DOCTYPE html>
<html>
<head>
<title>Page Title</title>
<style type="text/css">

.progress-container {
  width: 300px;
  height: 30px;
  background-color: #000;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  width: 70%; /* progress percentage */
  background: linear-gradient(90deg,rgba(0, 255, 0, 1) 0%, rgba(255, 255, 0, 1) 50%, rgba(255, 0, 0, 1) 100%);
  background-size: 300px 100%;
  background-repeat: no-repeat;
  background-position: left;
  position: absolute;
  top: 0;
  left: 0;
}

  </style>
</head>
<body>

<h1>My First Heading</h1>
<p>My first paragradph.</p>

<div class="progress-container">
  <div class="progress-bar" style="width: 50%;"></div>
</div>

</body>
</html>
```
