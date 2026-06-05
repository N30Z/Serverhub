package com.serverhub.android.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.serverhub.android.ui.theme.BorderSubtle

@Composable
fun AreaChart(
    data: List<Double>,
    color: Color,
    modifier: Modifier = Modifier,
    lineWidth: Dp = 1.5.dp
) {
    Canvas(modifier = modifier) {
        if (data.size < 2) return@Canvas
        val maxV = data.max()
        val minV = data.min()
        val range = (maxV - minV).coerceAtLeast(1.0)

        fun xAt(i: Int) = i * size.width / (data.size - 1)
        fun yAt(v: Double) = size.height - ((v - minV) / range * size.height).toFloat()

        val points = data.mapIndexed { i, v -> Offset(xAt(i), yAt(v)) }

        // Fill path
        val fillPath = Path().apply {
            moveTo(points.first().x, size.height)
            // Smooth cubic bezier through points
            for (i in 0 until points.size - 1) {
                val p0 = points[i]
                val p1 = points[i + 1]
                val cx = (p0.x + p1.x) / 2f
                cubicTo(cx, p0.y, cx, p1.y, p1.x, p1.y)
            }
            lineTo(points.last().x, size.height)
            close()
        }
        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.25f), Color.Transparent),
                startY = 0f,
                endY = size.height
            )
        )

        // Line path
        val linePath = Path().apply {
            moveTo(points.first().x, points.first().y)
            for (i in 0 until points.size - 1) {
                val p0 = points[i]
                val p1 = points[i + 1]
                val cx = (p0.x + p1.x) / 2f
                cubicTo(cx, p0.y, cx, p1.y, p1.x, p1.y)
            }
        }
        drawPath(
            path = linePath,
            color = color,
            style = Stroke(
                width = lineWidth.toPx(),
                cap = StrokeCap.Round,
                join = StrokeJoin.Round
            )
        )
    }
}

@Composable
fun DonutChart(
    progress: Float,
    color: Color,
    trackColor: Color = BorderSubtle,
    modifier: Modifier = Modifier,
    strokeWidth: Dp = 7.dp
) {
    Canvas(modifier = modifier) {
        val stroke = strokeWidth.toPx()
        val inset = stroke / 2f
        val rect = Size(size.width - stroke, size.height - stroke)

        drawArc(
            color = trackColor,
            startAngle = -90f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = Offset(inset, inset),
            size = rect,
            style = Stroke(width = stroke, cap = StrokeCap.Round)
        )

        if (progress > 0f) {
            drawArc(
                color = color,
                startAngle = -90f,
                sweepAngle = (360f * progress.coerceIn(0f, 1f)),
                useCenter = false,
                topLeft = Offset(inset, inset),
                size = rect,
                style = Stroke(width = stroke, cap = StrokeCap.Round)
            )
        }
    }
}

@Composable
fun HorizontalBar(
    progress: Float,
    color: Color,
    trackColor: Color = BorderSubtle,
    modifier: Modifier = Modifier,
    barHeight: Dp = 4.dp
) {
    Canvas(modifier = modifier) {
        val h = barHeight.toPx()
        val y = (size.height - h) / 2f
        val radius = h / 2f

        drawRoundRect(
            color = trackColor,
            topLeft = Offset(0f, y),
            size = Size(size.width, h),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(radius)
        )
        val w = (size.width * progress.coerceIn(0f, 1f)).coerceAtLeast(if (progress > 0f) h else 0f)
        if (w > 0f) {
            drawRoundRect(
                color = color,
                topLeft = Offset(0f, y),
                size = Size(w, h),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(radius)
            )
        }
    }
}

/** Dual-line area chart for network RX/TX */
@Composable
fun DualAreaChart(
    rxData: List<Double>,
    txData: List<Double>,
    rxColor: Color,
    txColor: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val all = rxData + txData
        if (all.size < 2) return@Canvas
        val maxV = all.max()
        val minV = 0.0
        val range = maxV.coerceAtLeast(0.001)

        fun xAt(i: Int, size: Int) = i * this.size.width / (size - 1).coerceAtLeast(1)
        fun yAt(v: Double) = this.size.height - (v / range * this.size.height).toFloat()

        fun drawSeries(data: List<Double>, color: Color) {
            if (data.size < 2) return
            val points = data.mapIndexed { i, v -> Offset(xAt(i, data.size), yAt(v)) }

            val fillPath = Path().apply {
                moveTo(points.first().x, this@Canvas.size.height)
                for (i in 0 until points.size - 1) {
                    val cx = (points[i].x + points[i + 1].x) / 2f
                    cubicTo(cx, points[i].y, cx, points[i + 1].y, points[i + 1].x, points[i + 1].y)
                }
                lineTo(points.last().x, this@Canvas.size.height)
                close()
            }
            drawPath(fillPath, brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.2f), Color.Transparent),
                startY = 0f, endY = this@Canvas.size.height
            ))

            val linePath = Path().apply {
                moveTo(points.first().x, points.first().y)
                for (i in 0 until points.size - 1) {
                    val cx = (points[i].x + points[i + 1].x) / 2f
                    cubicTo(cx, points[i].y, cx, points[i + 1].y, points[i + 1].x, points[i + 1].y)
                }
            }
            drawPath(linePath, color = color, style = Stroke(width = 1.5.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        }

        drawSeries(txData, txColor)
        drawSeries(rxData, rxColor)
    }
}
